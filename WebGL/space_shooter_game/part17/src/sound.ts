export class Sound {
    private audioBuffer: AudioBuffer | null = null;

    public volume = 0.00001;

    constructor(private audioContext: AudioContext, private data: ArrayBuffer) {
        audioContext.decodeAudioData(data)
            .then(buffer => this.audioBuffer = buffer);
    }

    public play() 
    {
        // create a gain node to control the volume
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = this.volume;
        gainNode.connect(this.audioContext.destination);

        // create a buffer source to play the sound once
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.connect(gainNode);

        source.start();
    }
}