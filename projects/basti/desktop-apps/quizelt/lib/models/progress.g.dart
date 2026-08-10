// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'progress.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

import 'package:hive/hive.dart';

class ProgressAdapter extends TypeAdapter<Progress> {
  @override
  final int typeId = 3;

  @override
  Progress read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Progress(
      id: fields[0] as String,
      userId: fields[1] as String,
      setId: fields[2] as String,
      cardId: fields[3] as String,
      timesStudied: fields[4] as int,
      timesCorrect: fields[5] as int,
      lastStudied: fields[6] as DateTime,
      isMastered: fields[7] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, Progress obj) {
    writer
      ..writeByte(8)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.userId)
      ..writeByte(2)
      ..write(obj.setId)
      ..writeByte(3)
      ..write(obj.cardId)
      ..writeByte(4)
      ..write(obj.timesStudied)
      ..writeByte(5)
      ..write(obj.timesCorrect)
      ..writeByte(6)
      ..write(obj.lastStudied)
      ..writeByte(7)
      ..write(obj.isMastered);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ProgressAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

