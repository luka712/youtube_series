#version 300 es 
precision mediump float;

in vec2 v_texCoords;

uniform sampler2D u_texture;

out vec4 fragColor;

float weights[5] = float[](
    0.204163688, // main pixel, sampled once
    0.180173822, // left and right of main pixel
    0.123831536, 
    0.066282245, 
    0.027630550);

void main()
{
    // single pixel offset in x direction
    float horizontalTexel = 1.0f / vec2(textureSize(u_texture, 0)).x;

    vec4 result = texture(u_texture, v_texCoords) * weights[0];

    for(int i = 1; i < 5;i++)
    {
        float fi = float(i);
        vec2 offset = vec2(horizontalTexel* fi, 0.0f); // single pixel offset horizontal

        vec2 samleCoordsRight = v_texCoords + offset;
        vec2 samleCoordsLeft = v_texCoords - offset;

        result += texture(u_texture, samleCoordsRight) * weights[i];   
        result += texture(u_texture, samleCoordsLeft) * weights[i];     
    }

    fragColor = vec4(result.rgb, 1.0);
}