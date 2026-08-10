// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'card_set.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

import 'package:hive/hive.dart';

class CardSetAdapter extends TypeAdapter<CardSet> {
  @override
  final int typeId = 1;

  @override
  CardSet read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return CardSet(
      id: fields[0] as String,
      title: fields[1] as String,
      description: fields[2] as String?,
      userId: fields[3] as String,
      createdAt: fields[4] as DateTime,
      updatedAt: fields[5] as DateTime,
      isFavorite: fields[6] as bool,
      folderId: fields[7] as String?,
      shareCode: fields[8] as String,
    );
  }

  @override
  void write(BinaryWriter writer, CardSet obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.title)
      ..writeByte(2)
      ..write(obj.description)
      ..writeByte(3)
      ..write(obj.userId)
      ..writeByte(4)
      ..write(obj.createdAt)
      ..writeByte(5)
      ..write(obj.updatedAt)
      ..writeByte(6)
      ..write(obj.isFavorite)
      ..writeByte(7)
      ..write(obj.folderId)
      ..writeByte(8)
      ..write(obj.shareCode);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CardSetAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

