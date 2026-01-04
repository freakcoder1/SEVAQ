<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# House Help Backend

The server-side component of the House Help application, built with NestJS, TypeORM, and PostgreSQL.

## Prerequisites

- **Node.js**: v16+ (LTS recommended)
- **npm**: v8+
- **PostgreSQL**: v13+

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the `backend` root:
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=your_password
   DATABASE_NAME=house_help
   JWT_SECRET=your_super_secret_key
   PORT=3000
   ```

3. **Database Initialization**:
   The application uses TypeORM with `synchronize: true` in development, which automatically creates tables based on entities.

## Running the App

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

## API Documentation

- **Auth**: `/auth/signup`, `/auth/login`
- **Users**: `/users/profile`
- **Services**: `/services` (GET, POST)
- **Workers**: `/workers` (GET, POST), `/workers/search?lat=...&long=...&radius=...`
- **Bookings**: `/bookings` (GET, POST)

## Deployment

### Docker (Recommended)
You can containerize the application for consistent deployment.

1. **Build Image**:
   ```bash
   docker build -t house-help-backend .
   ```

2. **Run Container**:
   ```bash
   docker run -p 3000:3000 --env-file .env house-help-backend
   ```

### Cloud Platforms

- **Heroku**: Use the official [Heroku Buildpack for Node.js](https://devcenter.heroku.com/articles/nodejs-support).
- **AWS (Elastic Beanstalk)**: Zip the project and upload or use the EB CLI.
- **Render/Fly.io**: Connect your repository and configure the start command `npm run start:prod`.

## Support

For technical support or feature requests, contact the development team.

## License
MIT
