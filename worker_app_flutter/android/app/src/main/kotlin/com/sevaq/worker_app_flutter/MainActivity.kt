package com.sevaq.worker_app_flutter

import android.app.KeyguardManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.sevaq.worker_app_flutter/notifications"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        createNotificationChannels()
        
        // Set up method channel for creating full-screen PendingIntent
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "createFullScreenPendingIntent") {
                val bookingId = call.argument<String>("bookingId") ?: ""
                val serviceName = call.argument<String>("serviceName") ?: ""
                val serviceDate = call.argument<String>("serviceDate") ?: ""
                val startTime = call.argument<String>("startTime") ?: ""
                val customerName = call.argument<String>("customerName") ?: ""
                val customerAddress = call.argument<String>("customerAddress") ?: ""
                val price = call.argument<String>("price") ?: ""
                
                try {
                    val intent = Intent(this, FullScreenBookingActivity::class.java).apply {
                        action = "com.sevaq.worker_app_flutter.FULL_SCREEN_BOOKING"
                        putExtra("bookingId", bookingId)
                        putExtra("serviceName", serviceName)
                        putExtra("serviceDate", serviceDate)
                        putExtra("startTime", startTime)
                        putExtra("customerName", customerName)
                        putExtra("customerAddress", customerAddress)
                        putExtra("price", price)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or 
                                Intent.FLAG_ACTIVITY_CLEAR_TOP or 
                                Intent.FLAG_ACTIVITY_SINGLE_TOP
                    }
                    
                    val pendingIntent = PendingIntent.getActivity(
                        this,
                        bookingId.hashCode(), // Use bookingId hash as requestCode for uniqueness
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    
                    // Return the PendingIntent as a handle (we'll use it directly via platform channel)
                    result.success(bookingId.hashCode())
                } catch (e: Exception) {
                    result.error("CREATE_PENDING_INTENT_ERROR", e.message, null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Channel for new booking alerts (matches backend channelId and AndroidManifest default)
            val newBookingChannel = NotificationChannel(
                "new_booking_channel",
                "New Booking Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High priority notifications for new booking assignments"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }

            // Existing high priority channel
            val highPriorityChannel = NotificationChannel(
                "high_priority_channel",
                "High Priority Notifications",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications for new bookings and important updates"
                enableVibration(true)
                enableLights(true)
            }

            // Full-screen booking channel with IMPORTANCE_MAX
            val fullScreenChannel = NotificationChannel(
                "full_screen_booking_channel",
                "Critical Booking Alerts",
                NotificationManager.IMPORTANCE_MAX
            ).apply {
                description = "Full-screen notifications for new booking assignments requiring immediate attention"
                enableVibration(true)
                enableLights(true)
                setShowBadge(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(newBookingChannel)
            notificationManager.createNotificationChannel(highPriorityChannel)
            notificationManager.createNotificationChannel(fullScreenChannel)
        }
    }
}
