#version 300 es
precision mediump float;

in vec2 texCoords;

uniform sampler2D texture0; // screen texture
uniform sampler2D texture1; // vignette texture
uniform sampler2D texture2; // noise texture
uniform sampler2D texture3; // scanline texture

uniform float random;
uniform float time;

out vec4 outColor;

vec2 crtCoords(vec2 uv, float bendFactor)
{
    uv -= 0.5; // move from 0 to 1,  to -0.5 to 0.5 space
    uv *= 2.0; // move from -0.5 to 0.5, to -1 to 1 space

    uv.x *= 1.0 + pow(abs(uv.y) * bendFactor, 2.0);
    uv.y *= 1.0 + pow(abs(uv.x) * bendFactor, 2.0);

    uv /= 2.0; // move back to -0.5 to 0.5 space
    return uv + 0.5; // move back to 0 to 1 space
}

void main() 
{
    vec2 uv = texCoords;
    vec2 crtUV = crtCoords(texCoords, 0.2);

    vec4 vignetteColor = texture(texture1, texCoords);
    vec4 noiseColor = texture(texture2, vec2(uv.x + random, uv.y + random));
    vec4 scanlineColor = texture(texture3, vec2(crtUV.x / 2.0, crtUV.y / 2.0 - time));
 
    vec4 color = texture(texture0, crtUV) * vignetteColor;
 
    noiseColor = mix(noiseColor, scanlineColor, 0.3);
    color = mix(color, noiseColor, 0.05);

    outColor = color;
}