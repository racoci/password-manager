package com.determina.pass.domain

import java.io.ByteArrayOutputStream
import java.security.SecureRandom
import java.util.Base64
import java.util.zip.Deflater
import java.util.zip.Inflater
import javax.crypto.Cipher
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

class QrSync {

    private val protocolPrefix = "DP1:"

    fun compress(input: ByteArray): ByteArray {
        val deflater = Deflater(Deflater.DEFAULT_COMPRESSION, true) // true = deflate-raw
        deflater.setInput(input)
        deflater.finish()

        val outputStream = ByteArrayOutputStream(input.size)
        val buffer = ByteArray(1024)
        while (!deflater.finished()) {
            val count = deflater.deflate(buffer)
            outputStream.write(buffer, 0, count)
        }
        deflater.end()
        return outputStream.toByteArray()
    }

    fun decompress(input: ByteArray): ByteArray {
        val inflater = Inflater(true) // true = deflate-raw
        inflater.setInput(input)

        val outputStream = ByteArrayOutputStream(input.size * 2)
        val buffer = ByteArray(1024)
        while (!inflater.finished()) {
            val count = inflater.inflate(buffer)
            outputStream.write(buffer, 0, count)
        }
        inflater.end()
        return outputStream.toByteArray()
    }

    private fun deriveKey(password: String, salt: ByteArray): SecretKeySpec {
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val spec = PBEKeySpec(password.toCharArray(), salt, 100000, 256)
        val tmp = factory.generateSecret(spec)
        return SecretKeySpec(tmp.encoded, "AES")
    }

    fun encryptAndEncode(records: List<ServiceRecord>, passphrase: String): String {
        val compactJson = buildString {
            append("[")
            records.forEachIndexed { index, rec ->
                if (index > 0) append(",")
                append("[\"${rec.site}\",\"${rec.user}\",\"${rec.updated}\",${rec.level.value}]")
            }
            append("]")
        }

        val rawBytes = compactJson.encodeToByteArray()
        val compressed = compress(rawBytes)

        val random = SecureRandom()
        val salt = ByteArray(16)
        val iv = ByteArray(12)
        random.nextBytes(salt)
        random.nextBytes(iv)

        val key = deriveKey(passphrase, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec)
        val ciphertext = cipher.doFinal(compressed)

        val packet = ByteArray(salt.size + iv.size + ciphertext.size)
        System.arraycopy(salt, 0, packet, 0, salt.size)
        System.arraycopy(iv, 0, packet, salt.size, iv.size)
        System.arraycopy(ciphertext, 0, packet, salt.size + iv.size, ciphertext.size)

        val b64 = Base64.getEncoder().encodeToString(packet)
        return "$protocolPrefix$b64"
    }

    fun decodeAndDecrypt(payload: String, passphrase: String): List<ServiceRecord> {
        val trimmed = payload.trim()
        require(trimmed.startsWith(protocolPrefix)) { "Formato de payload inválido." }

        val b64 = trimmed.substring(protocolPrefix.length)
        val packet = Base64.getDecoder().decode(b64)
        require(packet.size >= 28) { "Payload truncado." }

        val salt = packet.copyOfRange(0, 16)
        val iv = packet.copyOfRange(16, 28)
        val ciphertext = packet.copyOfRange(28, packet.size)

        val key = deriveKey(passphrase, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val gcmSpec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec)
        val decompressedBytes = decompress(cipher.doFinal(ciphertext))

        val json = decompressedBytes.decodeToString()
        // Parser simplificado de tuplas: [["site","user","date",level],...]
        val list = mutableListOf<ServiceRecord>()
        val regex = Regex("""\["([^"]+)","([^"]+)","([^"]+)",(\d+)\]""")
        regex.findAll(json).forEach { match ->
            val (site, user, date, levelStr) = match.destructured
            val level = SecurityLevel.fromValue(levelStr.toIntOrNull() ?: 1)
            list.add(ServiceRecord(site + "_" + user, site, user, date, level))
        }

        return list
    }
}
