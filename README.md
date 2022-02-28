# Minimal Reproducible Example To Demonstrate Express Session undefined inside Nuxt SSR handler

## ERROR FIXED NOW!
- Thanks to some of the kind folks here https://www.reddit.com/r/node/comments/t2glov/how_exactly_does_session_work_when_your_frontend/

## How to run?
```
npm i && npm run start-dev
```

## How to reproduce?
- Checkout the main branch
### Step 1
* Retrieve logged in user with the following command
```
curl -v -b cookies.txt --insecure -XGET -H "Content-type: application/json" 'http://localhost:3000/user'
```
* The above command should return nothing because we are not logged in yet

### Step 2
* Login with the following command
```
curl -v --cookie-jar cookies.txt --insecure -XPOST -H "Content-type: application/json" -d '{"email":"test@example.com","password":"123456789"}' 'http://localhost:3000/login'
```
* You sould be able to get the response below
```
{"userId":1,"userName":"test@example.com","isAdmin":false}
```
### Step 3
* Verify we are still logged in by running command from step 1
* You should be able to get the response below
```
{"userId":1,"userName":"test@example.com","isAdmin":false}
```
* This means backend works perfectly, time to test the frontend