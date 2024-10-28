export default async function getVideoStream(): Promise<MediaStream> {
	return await navigator.mediaDevices.getUserMedia({
		video: true,
		audio: false,
	});
}
