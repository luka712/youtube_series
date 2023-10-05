struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) texCoords: vec2f
}

@vertex 
fn vertexMain(
    @location(0) pos: vec2f,  // xy
    @location(1) texCoords: vec2f, // uv
) -> VertexOut 
{ 
   
    var output : VertexOut; 

    output.position = vec4f(pos, 0.0, 1.0);
    output.texCoords = texCoords;

    return output;
}

@group(0) @binding(0)
var texSampler: sampler;

@group(0) @binding(1)
var tex: texture_2d<f32>;

var<private> weights: array<f32, 5> = array(
    0.204163688, 
    0.180173822, 
    0.123831536, 
    0.066282245, 
    0.027630550
);

@fragment
fn fragmentMainHorizontal(fragData: VertexOut ) -> @location(0) vec4f 
{
    var horizontalTexel = 1.0 / f32(textureDimensions(tex).x);

    var result = textureSample(tex, texSampler, fragData.texCoords) * weights[0];

    for(var i = 1; i < 5; i++)
    {
        var offset = vec2f( horizontalTexel * f32(i), 0.0);

        var sampleCoordsRight = fragData.texCoords + offset;
        var sampleCoordsLeft = fragData.texCoords - offset; 

        result += textureSample(tex, texSampler, sampleCoordsRight) * weights[i];
        result += textureSample(tex, texSampler, sampleCoordsLeft) * weights[i];
    }

    return vec4f(result.xyz, 1.0);
}


@fragment
fn fragmentMainVertical(fragData: VertexOut ) -> @location(0) vec4f 
{
    var verticalTexel = 1.0 / f32(textureDimensions(tex).y);

    var result = textureSample(tex, texSampler, fragData.texCoords) * weights[0];

    for(var i = 1; i < 5; i++)
    {
        var offset = vec2f(0.0, verticalTexel * f32(i));

        var sampleCoordsUp = fragData.texCoords + offset;
        var sampleCoordsDown = fragData.texCoords - offset; 

        result += textureSample(tex, texSampler, sampleCoordsUp) * weights[i];
        result += textureSample(tex, texSampler, sampleCoordsDown) * weights[i];
    }

    return vec4f(result.xyz, 1.0);
}

