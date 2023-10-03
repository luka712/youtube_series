#version 300 es 

precision mediump float;

in vec2 v_texCoords;

uniform sampler2D u_texture;

out vec4 outColor;

float weights[5] = float[](
    0.204163688f, 
    0.180173822, 
    0.123831536f, 
    0.066282245f, 
    0.027630550f
);

void main() 
{
    float verticalTexel = 1.0f / vec2(textureSize(u_texture, 0)).y;

    vec4 result = texture(u_texture, v_texCoords) * weights[0];

    for(int i = 1; i < 5; i++)
    {
        float fi = float(i);
        vec2 offset = vec2( 0.0f, fi * verticalTexel);

        vec2 sampleCoordsUp = v_texCoords + offset;
        vec2 sampleCoordsDown = v_texCoords - offset;

        result += texture(u_texture, sampleCoordsUp) * weights[i];
        result += texture(u_texture, sampleCoordsDown) * weights[i];
    }

    outColor = vec4(result.rgb, 1.0f);
}