// automatically generated by the FlatBuffers compiler, do not modify

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */

import * as flatbuffers from "../../../node_modules/flatbuffers/mjs/flatbuffers.js";

export class Minute {
  bb: flatbuffers.ByteBuffer|null = null;
  bb_pos = 0;
  __init(i:number, bb:flatbuffers.ByteBuffer):Minute {
  this.bb_pos = i;
  this.bb = bb;
  return this;
}

static getRootAsMinute(bb:flatbuffers.ByteBuffer, obj?:Minute):Minute {
  return (obj || new Minute()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

static getSizePrefixedRootAsMinute(bb:flatbuffers.ByteBuffer, obj?:Minute):Minute {
  bb.setPosition(bb.position() + flatbuffers.SIZE_PREFIX_LENGTH);
  return (obj || new Minute()).__init(bb.readInt32(bb.position()) + bb.position(), bb);
}

startTime():number {
  const offset = this.bb!.__offset(this.bb_pos, 4);
  return offset ? this.bb!.readUint32(this.bb_pos + offset) : 0;
}

precipitationChance():number {
  const offset = this.bb!.__offset(this.bb_pos, 6);
  return offset ? this.bb!.readUint8(this.bb_pos + offset) : 0;
}

precipitationIntensity():number {
  const offset = this.bb!.__offset(this.bb_pos, 8);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 0.0;
}

perceivedPrecipitationIntensity():number {
  const offset = this.bb!.__offset(this.bb_pos, 10);
  return offset ? this.bb!.readFloat32(this.bb_pos + offset) : 0.0;
}

static startMinute(builder:flatbuffers.Builder) {
  builder.startObject(4);
}

static addStartTime(builder:flatbuffers.Builder, startTime:number) {
  builder.addFieldInt32(0, startTime, 0);
}

static addPrecipitationChance(builder:flatbuffers.Builder, precipitationChance:number) {
  builder.addFieldInt8(1, precipitationChance, 0);
}

static addPrecipitationIntensity(builder:flatbuffers.Builder, precipitationIntensity:number) {
  builder.addFieldFloat32(2, precipitationIntensity, 0.0);
}

static addPerceivedPrecipitationIntensity(builder:flatbuffers.Builder, perceivedPrecipitationIntensity:number) {
  builder.addFieldFloat32(3, perceivedPrecipitationIntensity, 0.0);
}

static endMinute(builder:flatbuffers.Builder):flatbuffers.Offset {
  const offset = builder.endObject();
  return offset;
}

static createMinute(builder:flatbuffers.Builder, startTime:number, precipitationChance:number, precipitationIntensity:number, perceivedPrecipitationIntensity:number):flatbuffers.Offset {
  Minute.startMinute(builder);
  Minute.addStartTime(builder, startTime);
  Minute.addPrecipitationChance(builder, precipitationChance);
  Minute.addPrecipitationIntensity(builder, precipitationIntensity);
  Minute.addPerceivedPrecipitationIntensity(builder, perceivedPrecipitationIntensity);
  return Minute.endMinute(builder);
}
}