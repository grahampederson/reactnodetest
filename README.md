# React & Node.js Skill Test

## Estimated Time

- 60 min

## Requirements

- Bug fix to login without any issues (20min) <br/>
  There is no need to change or add login function.
  Interpret the code structure and set the correct environment by the experience of building projects. <br/>
  Here is a login information. <br/>
  ✓ email: admin@gmail.com  ✓ password: admin123

- Implement Restful API of "Meeting" in the both of server and client sides (40min)<br/>
  Focus Code Style and Code Optimization. <br/>
  Reference other functions.

## Running the application

Install asdf (assuming ubuntu for everything)
* https://github.com/asdf-vm/asdf/releases
* Download and extract to ~
* asdf plugin add nodejs
* asdf install nodejs 18.19.0
* asdf local nodejs 18.19.0

User Mongodb Docker
* docker run -d -p 27017:27017 --name mongodb mongo:4.4 # may require sudo?

Start Server and Client:
* cd Server && npm install && npm start
* cd ../Client && npm install && npm start

Verify that this works - 
* go to localhost:3000 - login with admin@gmail.com / admin123
* go to localhost:3000/metting (This should be meeting) - and add a new meeting. Filter. Done.