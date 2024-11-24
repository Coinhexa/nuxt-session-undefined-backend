# Working CSRF tokens backend

## Notes

- I have managed to make this backend work with CSRF tokens on all 3 browsers (Chrome, Firefox, Safari on Apple Silicon based Mac Mini M1 running 15.1.1 (24B91))
- Chrome: Version 131.0.6778.86 (Official Build) (arm64)
- Firefox: 132.0.2 (aarch64)
- Safari: Version 18.1.1 (20619.2.8.11.12)
- In order to test the version that doesn't work, jump to this commit ID _**b9cd320d7d314435af82f72f415da320c44924ce**_ with commit message _**feat: add csrf**_

## How to run?

### Step 1

- Clone the [backend](https://github.com/Coinhexa/nuxt-session-undefined-backend)

        git clone https://github.com/Coinhexa/nuxt-session-undefined-backend.git

### Step 2

- Navigate into the directory

        cd nuxt-session-undefined-backend && npm i && npm run start-dev

### Step 3

- Run the frontend as per the instructions mentioned [there](https://github.com/Coinhexa/nuxt-session-undefined-frontend)
