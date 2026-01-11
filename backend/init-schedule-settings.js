require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { SystemSetting } = require('./src/models');

const scheduleSettings = [
  {
    setting_key: 'matching.schedule_type',
    setting_value: 'monthly',
    data_type: 'string',
    description: 'Preset schedule type: weekly, biweekly, monthly, or custom'
  },
  {
    setting_key: 'matching.cron_expression',
    setting_value: '0 9 1 * *',
    data_type: 'string',
    description: 'Cron expression for scheduled matching (used when schedule_type is custom or as reference)'
  },
  {
    setting_key: 'matching.schedule_timezone',
    setting_value: 'America/New_York',
    data_type: 'string',
    description: 'Timezone for scheduled matching jobs'
  },
  {
    setting_key: 'matching.auto_schedule_enabled',
    setting_value: 'true',
    data_type: 'boolean',
    description: 'Whether automatic scheduled matching is enabled'
  },
  {
    setting_key: 'matching.last_scheduled_run_at',
    setting_value: null,
    data_type: 'string',
    description: 'ISO timestamp of last scheduled run'
  }
];

async function initScheduleSettings() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('Connection successful!');

    console.log('Seeding schedule settings...');

    for (const setting of scheduleSettings) {
      const existing = await SystemSetting.findOne({
        where: { setting_key: setting.setting_key }
      });

      if (existing) {
        console.log(`Setting ${setting.setting_key} already exists, skipping...`);
      } else {
        await SystemSetting.create(setting);
        console.log(`Created setting: ${setting.setting_key}`);
      }
    }

    console.log('Schedule settings initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize schedule settings:', error);
    process.exit(1);
  }
}

initScheduleSettings();
