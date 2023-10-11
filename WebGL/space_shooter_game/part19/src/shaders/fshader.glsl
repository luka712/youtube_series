#version 300 es 
precision mediump float;

in vec2 vTexCoords;
in vec3 vColor;

uniform sampler2D uTexture;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 brightness;

const float brightnessThreshold = 0.4;

void main()
{
    fragColor = texture(uTexture, vTexCoords) * vec4(vColor, 1.0);
    float br = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));

    if(br > brightnessThreshold)
    {
        brightness = fragColor;
    }
    else 
    {
        brightness = vec4(0.0, 0.0, 0.0, fragColor.a);
    }

}