"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = require("@nestjs/config");
const user_entity_1 = require("./src/users/entities/user.entity");
const service_entity_1 = require("./src/services/entities/service.entity");
const worker_entity_1 = require("./src/workers/entities/worker.entity");
const slot_entity_1 = require("./src/slots/entities/slot.entity");
const booking_entity_1 = require("./src/bookings/entities/booking.entity");
const payment_entity_1 = require("./src/payments/entities/payment.entity");
const review_entity_1 = require("./src/reviews/entities/review.entity");
const micro_zone_entity_1 = require("./src/locations/entities/micro_zone.entity");
const service_area_entity_1 = require("./src/locations/entities/service_area.entity");
const waitlist_entity_1 = require("./src/locations/entities/waitlist.entity");
const service_request_entity_1 = require("./src/service-requests/entities/service-request.entity");
const metric_entity_1 = require("./src/metrics/entities/metric.entity");
const service_profile_entity_1 = require("./src/service-profiles/entities/service-profile.entity");
const subscription_entity_1 = require("./src/subscriptions/entities/subscription.entity");
const admin_user_entity_1 = require("./src/admin/entities/admin-user.entity");
const audit_log_entity_1 = require("./src/audit/entities/audit-log.entity");
const support_ticket_entity_1 = require("./src/support/entities/support-ticket.entity");
const communication_log_entity_1 = require("./src/support/entities/communication-log.entity");
const notification_template_entity_1 = require("./src/config/entities/notification-template.entity");
const business_hours_entity_1 = require("./src/config/entities/business-hours.entity");
const service_area_entity_2 = require("./src/config/entities/service-area.entity");
const pricing_rule_entity_1 = require("./src/config/entities/pricing-rule.entity");
const payout_entity_1 = require("./src/finance/entities/payout.entity");
const refund_entity_1 = require("./src/finance/entities/refund.entity");
const address_entity_1 = require("./src/addresses/entities/address.entity");
const add_missing_service_booking_columns_1 = require("./src/migrations/add-missing-service-booking-columns");
const fix_worker_location_data_1 = require("./src/migrations/fix-worker-location-data");
const add_missing_service_detail_columns_1 = require("./src/migrations/add-missing-service-detail-columns");
const add_missing_microzone_columns_1 = require("./src/migrations/add-missing-microzone-columns");
const create_service_requests_table_1 = require("./src/migrations/create-service-requests-table");
const _1768351862231_RenameWorkerUserIdToUserId_1 = require("./src/migrations/1768351862231-RenameWorkerUserIdToUserId");
const _1768351862230_AddYearsOfExperienceToWorker_1 = require("./src/migrations/1768351862230-AddYearsOfExperienceToWorker");
const _1738467600000_AddPhoneUniqueConstraint_1 = require("./src/migrations/1738467600000-AddPhoneUniqueConstraint");
const add_booking_type_column_1 = require("./src/migrations/add-booking-type-column");
const add_fcm_token_to_worker_1 = require("./src/migrations/add-fcm-token-to-worker");
async function runMigrations() {
    const configService = new config_1.ConfigService();
    const databaseUrl = configService.get('DATABASE_URL');
    let host = '';
    let port = 5432;
    let username = '';
    let password = '';
    let database = '';
    const isRailwayUrl = databaseUrl && (databaseUrl.includes('.railway') || databaseUrl.includes('.rlwy.net'));
    if (isRailwayUrl) {
        console.log('🔍 Railway DATABASE_URL detected, parsing...');
        try {
            const url = new URL(databaseUrl);
            host = url.hostname;
            port = parseInt(url.port) || 5432;
            username = url.username;
            password = url.password;
            let dbPath = url.pathname.replace('/', '');
            if (dbPath && !dbPath.includes('.')) {
                database = dbPath;
            }
            else {
                database = configService.get('DB_NAME', 'railway');
            }
            console.log('📊 Parsed Railway DB config:', { host, port, username, database: '***', hasPassword: !!password });
        }
        catch (e) {
            console.error('❌ Failed to parse DATABASE_URL:', e.message);
            database = configService.get('DB_NAME', 'railway');
            host = configService.get('DB_HOST', 'localhost');
        }
    }
    else {
        host = configService.get('DB_HOST', 'localhost');
        port = configService.get('DB_PORT', 5432);
        username = configService.get('DB_USERNAME', 'sevaq_user');
        password = configService.get('DB_PASSWORD', 'sevaq_password');
        database = configService.get('DB_NAME', 'sevaq_db');
    }
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: host,
        port: port,
        username: username,
        password: password,
        database: database,
        entities: [
            user_entity_1.User,
            service_entity_1.Service,
            worker_entity_1.Worker,
            slot_entity_1.Slot,
            booking_entity_1.Booking,
            payment_entity_1.Payment,
            review_entity_1.Review,
            micro_zone_entity_1.MicroZone,
            service_area_entity_1.ServiceArea,
            service_area_entity_2.ServiceArea,
            waitlist_entity_1.Waitlist,
            service_request_entity_1.ServiceRequest,
            metric_entity_1.AssignmentMetric,
            metric_entity_1.WorkerPerformanceMetric,
            metric_entity_1.UserBehaviorMetric,
            metric_entity_1.SystemPerformanceMetric,
            service_profile_entity_1.ServiceProfile,
            subscription_entity_1.Subscription,
            admin_user_entity_1.AdminUser,
            audit_log_entity_1.AuditLog,
            support_ticket_entity_1.SupportTicket,
            communication_log_entity_1.CommunicationLog,
            notification_template_entity_1.NotificationTemplate,
            business_hours_entity_1.BusinessHours,
            pricing_rule_entity_1.PricingRule,
            payout_entity_1.Payout,
            refund_entity_1.Refund,
            address_entity_1.Address,
        ],
        synchronize: false,
        logging: true,
        migrations: [
            fix_worker_location_data_1.FixWorkerLocationData1736660000000,
            add_missing_service_booking_columns_1.AddMissingServiceBookingColumns1736660000001,
            add_missing_service_detail_columns_1.AddMissingServiceDetailColumns1736660000002,
            add_missing_microzone_columns_1.AddMissingMicroZoneColumns1736660000003,
            create_service_requests_table_1.CreateServiceRequestsTable1736660000004,
            _1738467600000_AddPhoneUniqueConstraint_1.AddPhoneUniqueConstraint1738467600000,
            _1768351862230_AddYearsOfExperienceToWorker_1.AddYearsOfExperienceToWorker1768351862230,
            _1768351862231_RenameWorkerUserIdToUserId_1.RenameWorkerUserIdToUserId1768351862231,
            add_booking_type_column_1.AddBookingTypeColumn1736660000002,
            add_fcm_token_to_worker_1.AddFcmTokenToWorker1739999999999
        ],
    });
    try {
        await dataSource.initialize();
        console.log('✅ Data Source has been initialized!');
        await dataSource.runMigrations();
        console.log('✅ All migrations have been run successfully!');
        const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
        console.log('\n📋 Created tables:');
        tables.forEach((table) => console.log(`  - ${table.table_name}`));
        console.log(`\n✅ Total tables created: ${tables.length}`);
        await dataSource.destroy();
        console.log('\n✅ Database schema initialization completed successfully!');
        console.log('✅ Database is ready for application usage.');
    }
    catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}
runMigrations();
//# sourceMappingURL=run-migration.js.map