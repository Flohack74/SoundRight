module.exports = {
  apps: [{
    name: 'soundright-backend',
    script: './backend/dist/index.js',
    cwd: '/var/www/kiloherzz-soundright',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/www/kiloherzz-soundright/logs/soundright-error.log',
    out_file: '/var/www/kiloherzz-soundright/logs//soundright-out.log',
    log_file: '/var/www/kiloherzz-soundright/logs//soundright-combined.log',
    time: true
  }]
};

