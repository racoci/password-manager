package com.determina.pass.domain

class PasswordGenerator {

    fun generate(
        site: String,
        user: String,
        globalMaster: String,
        serviceMaster: String,
        created: String,
        level: SecurityLevel = SecurityLevel.Low
    ): String {
        val seed = "$site|$user|$created|$globalMaster|$serviceMaster|${level.value}"
        var hash = sha256(seed.encodeToByteArray())

        if (level == SecurityLevel.Ultra) {
            hash = sha256(hash)
        }

        val chars = when (level) {
            SecurityLevel.Low -> "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
            SecurityLevel.Medium -> "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*"
            SecurityLevel.High -> "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*()_+-=[]{}|;:,.<>"
            SecurityLevel.Ultra -> "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*()_+-=[]{}|;:,.<>?/`~"
        }

        val length = level.length
        val sb = StringBuilder(length)

        for (i in 0 until length) {
            val b1 = hash[i % hash.size].toInt() and 0xFF
            val b2 = hash[(i + 3) % hash.size].toInt() and 0xFF
            val byteVal = b1 xor b2
            val idx = byteVal % chars.length
            sb.append(chars[idx])
        }

        return sb.toString()
    }

    companion object {
        fun sha256(input: ByteArray): ByteArray {
            val k = intArrayOf(
                0x428a2f98.toInt(), 0x71374491.toInt(), 0xb5c0fbcf.toInt(), 0xe9b5dba5.toInt(),
                0x3956c25b, 0x59f111f1, 0x923f82a4.toInt(), 0xab1c5ed5.toInt(),
                0xd807aa98.toInt(), 0x12835b01, 0x243185be, 0x550c7dc3,
                0x72be5d74, 0x80deb1fe.toInt(), 0x9bdc06a7.toInt(), 0xc19bf174.toInt(),
                0xe49b69c1.toInt(), 0xefbe4786.toInt(), 0x0fc19dc6, 0x240ca1cc,
                0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
                0x983e5152.toInt(), 0xa831c66d.toInt(), 0xb00327c8.toInt(), 0xbf597fc7.toInt(),
                0xc6e00bf3.toInt(), 0xd5a79147.toInt(), 0x06ca6351, 0x14292967,
                0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
                0x650a7354, 0x766a0abb, 0x81c2c92e.toInt(), 0x92722c85.toInt(),
                0xa2bfe8a1.toInt(), 0xa81a664b.toInt(), 0xc24b8b70.toInt(), 0xc76c51a3.toInt(),
                0xd192e819.toInt(), 0xd6990624.toInt(), 0xf40e3585.toInt(), 0x106aa070,
                0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
                0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
                0x748f82ee, 0x78a5636f, 0x84c87814.toInt(), 0x8cc70208.toInt(),
                0x90befffa.toInt(), 0xa4506ceb.toInt(), 0xbef9a3f7.toInt(), 0xc67178f2.toInt()
            )

            var h0 = 0x6a09e667
            var h1 = 0xbb67ae85.toInt()
            var h2 = 0x3c6ef372
            var h3 = 0xa54ff53a.toInt()
            var h4 = 0x510e527f
            var h5 = 0x9b05688c.toInt()
            var h6 = 0x1f83d9ab
            var h7 = 0x5be0cd19

            val bitLength = input.size.toLong() * 8
            val extraLength = ((56 - (input.size + 1) % 64) + 64) % 64
            val padded = ByteArray(input.size + 1 + extraLength + 8)
            input.copyInto(padded, 0)
            padded[input.size] = 0x80.toByte()

            for (i in 0..7) {
                padded[padded.size - 1 - i] = ((bitLength ushr (i * 8)) and 0xFF).toByte()
            }

            val w = IntArray(64)
            for (chunkOffset in padded.indices step 64) {
                for (t in 0..15) {
                    w[t] = ((padded[chunkOffset + t * 4].toInt() and 0xFF) shl 24) or
                            ((padded[chunkOffset + t * 4 + 1].toInt() and 0xFF) shl 16) or
                            ((padded[chunkOffset + t * 4 + 2].toInt() and 0xFF) shl 8) or
                            (padded[chunkOffset + t * 4 + 3].toInt() and 0xFF)
                }
                for (t in 16..63) {
                    val s0 = (w[t - 15] ushr 7 or (w[t - 15] shl 25)) xor
                            (w[t - 15] ushr 18 or (w[t - 15] shl 14)) xor
                            (w[t - 15] ushr 3)
                    val s1 = (w[t - 2] ushr 17 or (w[t - 2] shl 15)) xor
                            (w[t - 2] ushr 19 or (w[t - 2] shl 13)) xor
                            (w[t - 2] ushr 10)
                    w[t] = w[t - 16] + s0 + w[t - 7] + s1
                }

                var a = h0
                var b = h1
                var c = h2
                var d = h3
                var e = h4
                var f = h5
                var g = h6
                var h = h7

                for (t in 0..63) {
                    val s1 = (e ushr 6 or (e shl 26)) xor (e ushr 11 or (e shl 21)) xor (e ushr 25 or (e shl 7))
                    val ch = (e and f) xor (e.inv() and g)
                    val temp1 = h + s1 + ch + k[t] + w[t]
                    val s0 = (a ushr 2 or (a shl 30)) xor (a ushr 13 or (a shl 19)) xor (a ushr 22 or (a shl 10))
                    val maj = (a and b) xor (a and c) xor (b and c)
                    val temp2 = s0 + maj

                    h = g
                    g = f
                    f = e
                    e = d + temp1
                    d = c
                    c = b
                    b = a
                    a = temp1 + temp2
                }

                h0 += a
                h1 += b
                h2 += c
                h3 += d
                h4 += e
                h5 += f
                h6 += g
                h7 += h
            }

            val result = ByteArray(32)
            val h = intArrayOf(h0, h1, h2, h3, h4, h5, h6, h7)
            for (i in 0..7) {
                result[i * 4] = ((h[i] ushr 24) and 0xFF).toByte()
                result[i * 4 + 1] = ((h[i] ushr 16) and 0xFF).toByte()
                result[i * 4 + 2] = ((h[i] ushr 8) and 0xFF).toByte()
                result[i * 4 + 3] = (h[i] and 0xFF).toByte()
            }
            return result
        }
    }
}
