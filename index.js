const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


//middleware
app.use(cors());
app.use(express.json());




const uri = "mongodb+srv://cseaa:pkzg6b7a9ANdKSkP@cluster0.wlgklm6.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        //user section
        //------------
        const user = client.db('cseaa').collection('user');
        //for creating user
        app.post('/user', async(req,res)=>{
            const newUser = req.body;
            console.log(newUser);
            const result = await user.insertOne(newUser);
            res.send(result);
        })
        //for reading user
        app.get('/user', async (req, res) => {
            const cursor = user.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //News Section
        //------------
        const news = client.db('cseaa').collection('news');
        //for reading news
        app.get('/news', async (req, res) => {
            const cursor = news.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //for creating news
        app.post('/news', async (req, res) => {
            const newNews = req.body;
            console.log(newNews);
            const result = await news.insertOne(newNews);
            res.send(result);
        })
        //for deleting
        app.delete('/news/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await news.deleteOne(query);
            res.send(result);
        })
        //for updating
        app.get('/news/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await news.findOne(query);
            res.send(result);
        })
        app.put('/news/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedNews = req.body;
            const update = {
                $set:{
                    post: updatedNews.post
                }
            }
            const result = await article.updateOne(filter, update, options);
            res.send(result);
        })

        //article section
        //-----------
        const article = client.db('cseaa').collection('article');
        //for reading article
        app.get('/article', async (req, res) => {
            const cursor = article.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //for updating
        app.get('/article/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await article.findOne(query);
            res.send(result);
        })
        app.put('/article/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedArticle = req.body;
            const update = {
                $set:{
                    title: updatedArticle.title,
                    details: updatedArticle.details
                }
            }
            const result = await article.updateOne(filter, update, options);
            res.send(result);
        })

        //for creating article
        app.post('/article', async (req, res) => {
            const newArticle = req.body;
            console.log(newArticle);
            const result = await article.insertOne(newArticle);
            res.send(result);
        })
        //for deleting
        app.delete('/article/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await article.deleteOne(query);
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);














app.get('/', (req, res) => {
    res.send('server  is running');
})

app.listen(port, () => {
    console.log(`Current port: ${port}`);
})