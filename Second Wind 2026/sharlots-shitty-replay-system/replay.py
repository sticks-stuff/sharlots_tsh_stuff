import argparse
import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence, Tuple


VIDEO_EXTS = {".mkv", ".webm"}


def emit_json(obj: object) -> None:
	# One JSON object per line (JSONL). Avoid any other stdout output in --json mode.
	sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
	sys.stdout.flush()


def resolve_tool(preferred_dirs: Sequence[Path], name: str, user_value: Optional[str]) -> str:
	if user_value:
		return user_value

	candidates: List[Path] = []
	for d in preferred_dirs:
		candidates.append(d / name)
		candidates.append(d / f"{name}.exe")

	for c in candidates:
		try:
			if c.exists() and c.is_file():
				return str(c)
		except OSError:
			continue

	# Fall back to PATH.
	return name


@dataclass(frozen=True)
class ProbeResult:
	duration_s: float
	width: int
	height: int


def _run_capture_json(args: Sequence[str]) -> dict:
	p = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
	if p.returncode != 0:
		raise RuntimeError(
			"Command failed:\n"
			+ " ".join(args)
			+ "\n\nSTDERR:\n"
			+ (p.stderr or "")
		)
	try:
		return json.loads(p.stdout)
	except json.JSONDecodeError as e:
		raise RuntimeError(
			"Failed to parse JSON output from:\n" + " ".join(args) + "\n\n" + p.stdout
		) from e


def ffprobe_video(ffprobe: str, path: Path) -> ProbeResult:
	# Fast-ish: ask for the first video stream's width/height + container duration.
	data = _run_capture_json(
		[
			ffprobe,
			"-v",
			"error",
			"-select_streams",
			"v:0",
			"-show_entries",
			"stream=width,height:format=duration",
			"-of",
			"json",
			str(path),
		]
	)

	fmt = data.get("format") or {}
	streams = data.get("streams") or []
	if not streams:
		raise RuntimeError(f"No video stream found in: {path}")
	stream0 = streams[0]

	duration = fmt.get("duration")
	if duration is None:
		# Sometimes format duration is missing; try stream duration.
		duration = stream0.get("duration")
	if duration is None:
		raise RuntimeError(f"Could not determine duration for: {path}")

	width = int(stream0.get("width") or 0)
	height = int(stream0.get("height") or 0)
	if width <= 0 or height <= 0:
		raise RuntimeError(f"Could not determine resolution for: {path}")

	return ProbeResult(duration_s=float(duration), width=width, height=height)


def discover_videos(directory: Path) -> List[Path]:
	if not directory.exists() or not directory.is_dir():
		raise RuntimeError(f"Not a directory: {directory}")

	paths: List[Path] = []
	for entry in directory.iterdir():
		if not entry.is_file():
			continue
		if entry.suffix.lower() in VIDEO_EXTS:
			paths.append(entry)

	# Oldest -> newest
	def sort_key(p: Path) -> Tuple[float, str]:
		# Sort by "Date modified".
		# (On Windows Explorer this corresponds to mtime.)
		try:
			t = os.path.getmtime(p)
		except OSError:
			t = 0.0
		return (t, p.name.lower())

	paths.sort(key=sort_key)
	return paths


def build_filter_complex_opencl(
	count: int,
	durations: Sequence[float],
	xfade_d: float,
	transition: str,
) -> Tuple[str, str]:
	# Returns (filter_complex, output_label)
	per_inputs: List[str] = []
	for i in range(count):
		# Normalize timestamps; upload to OpenCL.
		per_inputs.append(
			# Explicitly bind to the 'ocl' device created via -init_hw_device.
			f"[{i}:v]setpts=PTS-STARTPTS,format=nv12,hwupload=device=ocl[v{i}]"
		)

	chains: List[str] = []
	if count == 1:
		# Not used, but keep consistent.
		return ";".join(per_inputs), "v0"

	# xfade offsets: each transition starts (cumulative_duration - xfade_d)
	cumulative = durations[0]
	left = "v0"
	for i in range(1, count):
		offset = max(0.0, cumulative - xfade_d)
		out = f"x{i}"
		chains.append(
			f"[{left}][v{i}]xfade_opencl=transition={transition}:duration={xfade_d}:offset={offset}[{out}]"
		)
		cumulative = cumulative + durations[i] - xfade_d
		left = out

	filter_complex = ";".join(per_inputs + chains)
	# Download back to system memory for the encoder.
	# Use nv12 for speed and NVENC compatibility.
	filter_complex = filter_complex + f";[{left}]hwdownload,format=nv12[outv]"
	return filter_complex, "outv"


def build_filter_complex_cpu(
	count: int,
	durations: Sequence[float],
	xfade_d: float,
	transition: str,
) -> Tuple[str, str]:
	per_inputs: List[str] = []
	for i in range(count):
		per_inputs.append(
			f"[{i}:v]setpts=PTS-STARTPTS,format=nv12[v{i}]"
		)

	chains: List[str] = []
	if count == 1:
		return ";".join(per_inputs), "v0"

	cumulative = durations[0]
	left = "v0"
	for i in range(1, count):
		offset = max(0.0, cumulative - xfade_d)
		out = f"x{i}"
		chains.append(
			f"[{left}][v{i}]xfade=transition={transition}:duration={xfade_d}:offset={offset}[{out}]"
		)
		cumulative = cumulative + durations[i] - xfade_d
		left = out

	filter_complex = ";".join(per_inputs + chains)
	return filter_complex, left


def run_ffmpeg(cmd: Sequence[str], *, quiet: bool = False) -> int:
	if quiet:
		p = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
		return p.returncode

	# Stream ffmpeg output live; wait for completion.
	p = subprocess.Popen(cmd)
	return p.wait()


def move_used_videos(base_dir: Path, videos: Sequence[Path], *, quiet: bool = False) -> None:
	if not videos:
		return

	# Folder titled the same as the first video used.
	dest_dir = base_dir / videos[0].stem
	dest_dir.mkdir(parents=True, exist_ok=True)

	for src in videos:
		try:
			# shutil.move will overwrite only in limited cases; avoid collisions.
			dst = dest_dir / src.name
			if dst.exists():
				# Make a unique name if something is already there.
				stem = src.stem
				suffix = src.suffix
				k = 1
				while True:
					candidate = dest_dir / f"{stem}__{k}{suffix}"
					if not candidate.exists():
						dst = candidate
						break
					k += 1
			shutil.move(str(src), str(dst))
		except OSError as e:
			if not quiet:
				print(f"Failed to move {src} -> {dest_dir}: {e}", file=sys.stderr)


def build_ffmpeg_cmd(
	*,
	ffmpeg: str,
	inputs: Sequence[Path],
	output: Path,
	filter_complex: str,
	out_label: str,
	use_opencl: bool,
	vcodec: str,
	preset: str,
	cq: int,
	fastest: bool,
	extra_out_args: Sequence[str],
) -> List[str]:
	cmd: List[str] = [ffmpeg, "-hide_banner", "-y"]

	if use_opencl:
		# Let ffmpeg pick an OpenCL device by default.
		cmd += ["-init_hw_device", "opencl=ocl", "-filter_hw_device", "ocl"]

	# Inputs
	for p in inputs:
		cmd += ["-i", str(p)]

	cmd += [
		"-filter_complex",
		filter_complex,
		"-map",
		f"[{out_label}]",
		"-an",
		"-sn",
		"-dn",
	]

	# Encode as fast as possible.
	# If the output container is .mkv, h264_nvenc is broadly compatible.
	cmd += [
		"-c:v",
		vcodec,
		"-preset",
		preset,
	]
	# Prefer nv12 end-to-end for speed.
	cmd += ["-pix_fmt", "nv12"]

	if vcodec in {"h264_nvenc", "hevc_nvenc"}:
		if fastest:
			# Simplest / highest-throughput NVENC settings.
			# (Quality is intentionally sacrificed; you said size doesn't matter.)
			cmd += [
				"-rc",
				"constqp",
				"-qp",
				"40",
				"-bf",
				"0",
				"-rc-lookahead",
				"0",
				"-spatial_aq",
				"0",
				"-temporal_aq",
				"0",
			]
		else:
			cmd += ["-cq", str(cq)]

	cmd += list(extra_out_args)
	cmd += [str(output)]
	return cmd


def main(argv: Optional[Sequence[str]] = None) -> int:
	ap = argparse.ArgumentParser(
		description=(
			"Find .mkv/.webm files in a directory, sort oldest->newest, probe durations, "
			"and concatenate them with crossfades (GPU via xfade_opencl when available)."
		)
	)
	ap.add_argument(
		"directory",
		nargs="?",
		default=None,
		help="Directory to scan (default: directory containing this script)",
	)
	ap.add_argument("-o", "--output", default=None, help="Output file (default: <dir>/out.mkv)")
	ap.add_argument(
		"--ffmpeg",
		default=None,
		help="ffmpeg executable (default: prefer ./ffmpeg(.exe) in scan dir, then script dir, else PATH)",
	)
	ap.add_argument(
		"--ffprobe",
		default=None,
		help="ffprobe executable (default: prefer ./ffprobe(.exe) in scan dir, then script dir, else PATH)",
	)
	ap.add_argument("--xfade", type=float, default=0.5, help="Crossfade duration seconds")
	ap.add_argument(
		"--transition",
		default="fade",
		help="xfade/xfade_opencl transition name (default: fade)",
	)
	ap.add_argument(
		"--no-opencl",
		action="store_true",
		help="Force CPU xfade (disable xfade_opencl)",
	)
	ap.add_argument(
		"--no-fallback",
		action="store_true",
		help="If OpenCL fails, do not retry with CPU xfade",
	)
	ap.add_argument(
		"--vcodec",
		default="h264_nvenc",
		help="Video encoder (default: h264_nvenc)",
	)
	ap.add_argument(
		"--preset",
		default="p1",
		help="Encoder preset (NVENC: p1 fastest .. p7 best) (default: p1)",
	)
	ap.add_argument(
		"--cq",
		type=int,
		default=28,
		help="NVENC constant quality (lower=better, default 28)",
	)
	ap.add_argument(
		"--fastest",
		action="store_true",
		help="Max speed settings (NVENC constqp/qp=40, no lookahead/B-frames/AQ)",
	)
	ap.add_argument(
		"--",
		dest="passthrough",
		nargs=argparse.REMAINDER,
		default=[],
		help="Extra args appended to ffmpeg output options",
	)
	ap.add_argument(
		"--json",
		action="store_true",
		help="Emit JSON status events only (for Stream Deck/stateful executors)",
	)

	ns = ap.parse_args(argv)
	json_mode = True

	try:
		# If no directory is provided, default to the directory containing this script.
		script_dir = Path(__file__).resolve().parent
		directory = script_dir if ns.directory is None else Path(ns.directory).resolve()
		output = Path(ns.output).resolve() if ns.output else (directory / "out.mkv")

		# if json_mode:
			# emit_json({"state": "loading"})

		# Prefer ffmpeg/ffprobe that live in the target directory (then next to this script),
		# before falling back to PATH.
		ns.ffmpeg = resolve_tool([directory, script_dir], "ffmpeg", ns.ffmpeg)
		ns.ffprobe = resolve_tool([directory, script_dir], "ffprobe", ns.ffprobe)

		# Be explicit about overwriting output on Windows: remove existing file first.
		try:
			if output.exists() and output.is_file():
				output.unlink()
		except OSError:
			# ffmpeg will still attempt overwrite via -y; keep going.
			pass

		videos = discover_videos(directory)
		if not videos:
			if json_mode:
				emit_json({"state": "done", "ok": False, "error": "No videos found", "directory": str(directory)})
				return 2
			print(f"No .mkv/.webm files found in {directory}", file=sys.stderr)
			return 2

		if len(videos) == 1:
			# Fast path: just copy the single video's video stream, no audio.
			cmd = [
				ns.ffmpeg,
				"-hide_banner",
				"-y",
				"-i",
				str(videos[0]),
				"-map",
				"0:v:0",
				"-c",
				"copy",
				"-an",
				"-sn",
				"-dn",
				str(output),
			]
			rc = run_ffmpeg(cmd, quiet=json_mode)
			if rc == 0:
				move_used_videos(directory, videos, quiet=json_mode)
				if json_mode:
					emit_json({"state": "done", "ok": True, "output": str(output)})
			else:
				if json_mode:
					emit_json({"state": "done", "ok": False, "exitCode": rc})
			return rc

		probes: List[ProbeResult] = []
		for p in videos:
			probes.append(ffprobe_video(ns.ffprobe, p))

		# xfade requires matching frame geometry; we intentionally do NOT scale.
		width = probes[0].width
		height = probes[0].height
		for i, pr in enumerate(probes[1:], start=1):
			if pr.width != width or pr.height != height:
				raise RuntimeError(
					"Input resolutions do not match (scaling is disabled). "
					f"First={width}x{height}, file#{i+1}={pr.width}x{pr.height}"
				)
		durations = [pr.duration_s for pr in probes]

		xfade_d = float(ns.xfade)
		if xfade_d <= 0:
			raise RuntimeError("--xfade must be > 0")
		# Keep it sane: can’t crossfade longer than the shortest clip.
		min_d = min(durations)
		if xfade_d >= min_d:
			xfade_d = max(0.01, min_d * 0.25)

		extra_out_args = ns.passthrough or []

		# Try OpenCL first unless disabled.
		tried_opencl = False
		if not ns.no_opencl:
			tried_opencl = True
			fc, out_label = build_filter_complex_opencl(
				len(videos), durations, xfade_d, ns.transition
			)
			cmd = build_ffmpeg_cmd(
				ffmpeg=ns.ffmpeg,
				inputs=videos,
				output=output,
				filter_complex=fc,
				out_label=out_label,
				use_opencl=True,
				vcodec=ns.vcodec,
				preset=ns.preset,
				cq=ns.cq,
				fastest=ns.fastest,
				extra_out_args=extra_out_args,
			)
			rc = run_ffmpeg(cmd, quiet=json_mode)
			if rc == 0:
				move_used_videos(directory, videos, quiet=json_mode)
				if json_mode:
					emit_json({"state": "done", "ok": True, "output": str(output)})
				return 0
			if ns.no_fallback:
				if json_mode:
					emit_json({"state": "done", "ok": False, "exitCode": rc})
				return rc

		# CPU fallback.
		fc, out_label = build_filter_complex_cpu(
			len(videos), durations, xfade_d, ns.transition
		)
		cmd = build_ffmpeg_cmd(
			ffmpeg=ns.ffmpeg,
			inputs=videos,
			output=output,
			filter_complex=fc,
			out_label=out_label,
			use_opencl=False,
			vcodec=ns.vcodec,
			preset=ns.preset,
			cq=ns.cq,
			fastest=ns.fastest,
			extra_out_args=extra_out_args,
		)
		if tried_opencl and not json_mode:
			print(
				"OpenCL crossfade failed (xfade_opencl/hwupload/hwdownload). Retrying with CPU xfade...",
				file=sys.stderr,
			)
		rc = run_ffmpeg(cmd, quiet=json_mode)
		if rc == 0:
			move_used_videos(directory, videos, quiet=json_mode)
			if json_mode:
				emit_json({"state": "done", "ok": True, "output": str(output)})
		else:
			if json_mode:
				emit_json({"state": "done", "ok": False, "exitCode": rc})
		return rc
	except Exception as e:
		if json_mode:
			emit_json({"state": "done", "ok": False, "error": str(e)})
			return 1
		raise


if __name__ == "__main__":
	raise SystemExit(main())
