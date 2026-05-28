package expo.modules.audiosprectrum

import android.media.audiofx.Visualizer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.sqrt

class AudioSpectrumModule : Module() {
  private var visualizer: Visualizer? = null

  override fun definition() = ModuleDefinition {
    Name("AudioSpectrum")

    Events("onSpectrum")

    Function("startListening") { audioSessionId: Int ->
      startListening(audioSessionId)
    }

    Function("stopListening") {
      stopListening()
    }

    OnDestroy {
      stopListening()
    }
  }

  private fun startListening(audioSessionId: Int) {
    stopListening()

    try {
      val v = Visualizer(audioSessionId)
      v.captureSize = Visualizer.getCaptureSizeRange()[0]

      v.setDataCaptureListener(
        object : Visualizer.OnDataCaptureListener {
          override fun onWaveFormDataCapture(
            visualizer: Visualizer,
            waveform: ByteArray,
            samplingRate: Int
          ) {}

          override fun onFftDataCapture(
            visualizer: Visualizer,
            fft: ByteArray,
            samplingRate: Int
          ) {
            val magnitudes = computeMagnitudes(fft)
            sendEvent("onSpectrum", mapOf("bands" to magnitudes.toList()))
          }
        },
        Visualizer.getMaxCaptureRate(),
        false,
        true
      )

      v.enabled = true
      visualizer = v
    } catch (e: SecurityException) {
      sendEvent("onSpectrum", mapOf("bands" to List(32) { 0f }))
    } catch (e: Exception) {
      sendEvent("onSpectrum", mapOf("bands" to List(32) { 0f }))
    }
  }

  private fun stopListening() {
    visualizer?.let {
      it.enabled = false
      it.release()
    }
    visualizer = null
  }

  private fun computeMagnitudes(fft: ByteArray): FloatArray {
    val magnitudes = FloatArray(32)
    val n = minOf(fft.size / 2, 32)

    for (i in 0 until n) {
      val real = fft[i * 2].toFloat()
      val imag = fft[i * 2 + 1].toFloat()
      val mag = sqrt((real * real + imag * imag).toDouble()).toFloat()
      magnitudes[i] = (mag / 128f).coerceIn(0f, 1f)
    }

    return magnitudes
  }
}
