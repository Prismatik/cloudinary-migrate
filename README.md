# Cloudinary Migrator

### What it does?

This was designed to allow the migration of all images between one cloudinary account and another. It does two things! It downloads all the images from an account and it uploads all the images it downloaded into an account. But you can use it to do just one of these things if you would like!

### How to use it?

* Install Node
* Clone this Repo
* Edit the `config.json` file
* Input the api keys (CLOUD_NAME, API_KEY, API_SECRET) from the cloudinary account you want to download the images from in the "download" section
* Input the api keys (as above) from the cloudinary account you want to upload the images from in the "upload" section
* Run `node download.js`
* Wait some time...
* Run `node upload.js`

### Other

Images are downloaded into the images/ folder. If you want to upload other images put them there and run `node upload`. The filename (without the extension) is used as the public_id within cloudinary.