import java.security.NoSuchAlgorithmException
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
import java.util.TreeMap
import java.util.Base64

@Configuration
public class TelegramAuthV2 {
    public fun validateLogin(authData: String, hash: String, token: String): Boolean {
        val algorithm = "HmacSHA256"
        return try {
            Mac.getInstance(algorithm).apply {
                init(SecretKeySpec("WebAppData".toByteArray(), algorithm))
            }.let {mac ->
                val key = mac.doFinal(token.toByteArray())
                init(SecretKeySpec(key, algorithm))
                TreeMap<String, String>(authData.split("&").map { it.split("=") }.toMap()).run {
                    Base64.getEncoder().encodeToString(mac.doFinal(this.toByteArray())).equals(hash, true)
                }
            }
        } catch (e: NoSuchAlgorithmException) {
            e.printStackTrace()
            false
        }
    }
}