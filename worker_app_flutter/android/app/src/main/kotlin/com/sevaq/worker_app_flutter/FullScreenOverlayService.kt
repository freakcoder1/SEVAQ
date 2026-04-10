package com.sevaq.worker_app_flutter

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.core.app.NotificationCompat

/**
 * Service that shows a SYSTEM_ALERT_WINDOW overlay for full-screen booking notifications.
 * This works even when the screen is ON and the app is in the background.
 */
class FullScreenOverlayService : Service() {
    
    private var overlayView: View? = null
    private var windowManager: WindowManager? = null
    
    companion object {
        const val EXTRA_BOOKING_ID = "bookingId"
        const val EXTRA_SERVICE_NAME = "serviceName"
        const val EXTRA_SERVICE_DATE = "serviceDate"
        const val EXTRA_START_TIME = "startTime"
        const val EXTRA_CUSTOMER_NAME = "customerName"
        const val EXTRA_PRICE = "price"
        const val CHANNEL_ID = "full_screen_overlay_channel"
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            showOverlay(intent)
        }
        return START_NOT_STICKY
    }
    
    override fun onDestroy() {
        super.onDestroy()
        removeOverlay()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Full Screen Booking Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Shows full-screen booking notifications"
                enableVibration(true)
            }
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
        
        // Show a foreground notification to keep the service alive
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("New Booking Alert")
            .setContentText("You have a new booking assignment")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .build()
        
        startForeground(1, notification)
    }
    
    private fun showOverlay(intent: Intent) {
        // Remove existing overlay if any
        removeOverlay()
        
        val bookingId = intent.getStringExtra(EXTRA_BOOKING_ID) ?: "Unknown"
        val serviceName = intent.getStringExtra(EXTRA_SERVICE_NAME) ?: "Service"
        val serviceDate = intent.getStringExtra(EXTRA_SERVICE_DATE) ?: ""
        val startTime = intent.getStringExtra(EXTRA_START_TIME) ?: ""
        val customerName = intent.getStringExtra(EXTRA_CUSTOMER_NAME) ?: "Customer"
        val price = intent.getStringExtra(EXTRA_PRICE) ?: "0"
        
        // Create overlay layout programmatically
        val layout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(android.graphics.Color.parseColor("#CC000000")) // Semi-transparent black
            setPadding(40, 80, 40, 80)
        }
        
        // Title
        val titleView = TextView(this).apply {
            text = "नया काम आया है!"
            textSize = 28f
            setTextColor(android.graphics.Color.WHITE)
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 10)
        }
        layout.addView(titleView)
        
        // Subtitle
        val subtitleView = TextView(this).apply {
            text = "New Booking Assigned"
            textSize = 16f
            setTextColor(android.graphics.Color.parseColor("#AAAAAA"))
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 30)
        }
        layout.addView(subtitleView)
        
        // Booking details card
        val cardView = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(android.graphics.Color.parseColor("#33FFFFFF"))
            setPadding(30, 30, 30, 30)
        }
        
        // Service name
        val serviceView = TextView(this).apply {
            text = "🧹 $serviceName"
            textSize = 18f
            setTextColor(android.graphics.Color.WHITE)
            setPadding(0, 0, 0, 15)
        }
        cardView.addView(serviceView)
        
        // Date/Time
        val dateView = TextView(this).apply {
            text = "📅 $serviceDate at $startTime"
            textSize = 16f
            setTextColor(android.graphics.Color.WHITE)
            setPadding(0, 0, 0, 15)
        }
        cardView.addView(dateView)
        
        // Customer
        val customerView = TextView(this).apply {
            text = "👤 $customerName"
            textSize = 16f
            setTextColor(android.graphics.Color.WHITE)
            setPadding(0, 0, 0, 15)
        }
        cardView.addView(customerView)
        
        // Price
        val priceView = TextView(this).apply {
            text = "💰 ₹$price"
            textSize = 24f
            setTextColor(android.graphics.Color.parseColor("#4CAF50"))
            gravity = Gravity.CENTER
            setPadding(0, 20, 0, 0)
        }
        cardView.addView(priceView)
        
        layout.addView(cardView)
        
        // View button
        val viewButton = Button(this).apply {
            text = "VIEW DETAILS"
            textSize = 18f
            setBackgroundColor(android.graphics.Color.parseColor("#4CAF50"))
            setTextColor(android.graphics.Color.WHITE)
            setPadding(0, 20, 0, 20)
            val params = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 30
            }
            layoutParams = params
            setOnClickListener {
                removeOverlay()
                // Launch the Flutter app's FullScreenBookingActivity
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
                launchIntent?.apply {
                    putExtra("openFullScreenBooking", true)
                    putExtra(EXTRA_BOOKING_ID, bookingId)
                    putExtra(EXTRA_SERVICE_NAME, serviceName)
                    putExtra(EXTRA_SERVICE_DATE, serviceDate)
                    putExtra(EXTRA_START_TIME, startTime)
                    putExtra(EXTRA_CUSTOMER_NAME, customerName)
                    putExtra(EXTRA_PRICE, price)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                }
                startActivity(launchIntent)
                stopSelf()
            }
        }
        layout.addView(viewButton)
        
        // Dismiss button
        val dismissButton = Button(this).apply {
            text = "Dismiss"
            textSize = 14f
            setBackgroundColor(android.graphics.Color.TRANSPARENT)
            setTextColor(android.graphics.Color.parseColor("#888888"))
            setPadding(0, 15, 0, 15)
            val params = android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = 10
            }
            layoutParams = params
            setOnClickListener {
                removeOverlay()
                stopSelf()
            }
        }
        layout.addView(dismissButton)
        
        // Window parameters for SYSTEM_ALERT_WINDOW
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
            PixelFormat.TRANSLUCENT
        )
        
        params.gravity = Gravity.CENTER
        
        try {
            windowManager?.addView(layout, params)
            overlayView = layout
        } catch (e: Exception) {
            e.printStackTrace()
            // If overlay fails, fall back to launching the activity directly
            launchFallbackActivity(bookingId, serviceName, serviceDate, startTime, customerName, price)
        }
    }
    
    private fun launchFallbackActivity(
        bookingId: String,
        serviceName: String,
        serviceDate: String,
        startTime: String,
        customerName: String,
        price: String
    ) {
        val intent = Intent(this, FullScreenBookingActivity::class.java).apply {
            putExtra("bookingId", bookingId)
            putExtra("serviceName", serviceName)
            putExtra("serviceDate", serviceDate)
            putExtra("startTime", startTime)
            putExtra("customerName", customerName)
            putExtra("price", price)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        startActivity(intent)
        stopSelf()
    }
    
    private fun removeOverlay() {
        try {
            overlayView?.let {
                windowManager?.removeView(it)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        overlayView = null
    }
}
