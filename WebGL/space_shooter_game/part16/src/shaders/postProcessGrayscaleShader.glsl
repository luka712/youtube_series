#version 300 es 
precision mediump float;

in vec2 v_texCoords;

uniform sampler2D u_texture;

out vec4 fragColor;

void main()
{
    vec3 texColor = texture(u_texture, v_texCoords).rgb;
    vec3 grayscaleWeights = vec3(0.299, 0.587, 0.114);

    // texColor.r * 0.299 + texColor.g * 0.587 + texColor.b * 0.114
    float l = dot(texColor, grayscaleWeights);
    fragColor = vec4(vec3(l), 1.0);
}