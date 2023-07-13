struct VertexOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f,
}

@vertex 
fn vertexMain(
    @location(0) pos: vec2f,  // xy
    @location(1) color: vec3f,  // rgb
) -> VertexOut 
{ 
   
    var output : VertexOut; 

    output.position = vec4f(pos, 0.0, 1.0);
    output.color = vec4f(color, 1.0);

    return output;
}


@fragment
fn fragmentMain(fragData: VertexOut ) -> @location(0) vec4f 
{
    return fragData.color;
}
