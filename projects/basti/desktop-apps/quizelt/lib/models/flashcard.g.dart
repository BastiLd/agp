// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'flashcard.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

import 'package:hive/hive.dart';

class FlashcardAdapter extends TypeAdapter<Flashcard> {
  @override
  final int typeId = 0;

  @override
  Flashcard read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Flashcard(
      id: fields[0] as String,
      question: fields[1] as String,
      answer: fields[2] as String,
      hint: fields[3] as String?,
      setId: fields[4] as String,
      timesStudied: fields[5] as int,
      timesCorrect: fields[6] as int,
      lastStudied: fields[7] as DateTime,
      isFavorite: fields[8] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, Flashcard obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.question)
      ..writeByte(2)
      ..write(obj.answer)
      ..writeByte(3)
      ..write(obj.hint)
      ..writeByte(4)
      ..write(obj.setId)
      ..writeByte(5)
      ..write(obj.timesStudied)
      ..writeByte(6)
      ..write(obj.timesCorrect)
      ..writeByte(7)
      ..write(obj.lastStudied)
      ..writeByte(8)
      ..write(obj.isFavorite);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is FlashcardAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

