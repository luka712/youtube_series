#version 300 es 
precision mediump float;

in vec2 v_texCoords;

uniform sampler2D u_texture;

out vec4 fragColor;

float weights[5] = float[](0.20416368871516752f, 0.18017382291138087f, 0.1238315368057753f, 0.0662822452863612f, 0.027630550638898826f);

void main() {

    float horizontalTexel = 1.0f / vec2(textureSize(u_texture, 0)).x;

    // Vertical pass 
    vec4 result = texture(u_texture, v_texCoords) * weights[0];

    for(int i = 1; i < 5; i++) 
    {
        float fi = float(i);
        vec2 offset = vec2( horizontalTexel * fi, 0.0);
        vec2 sampleCoordsRight = v_texCoords + offset;
        vec2 sampleCoordsLeft = v_texCoords - offset;

        result += texture(u_texture, sampleCoordsRight) * weights[i];
        result += texture(u_texture, sampleCoordsLeft) * weights[i];
    }

    fragColor = vec4(result.rgb, 1.0f);
}