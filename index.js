const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

//middleware
app.use(cookieParser());
app.use(express.json());
// app.use(cors());

app.use(cors({
    origin: ['http://localhost:3000', 'https://cse-aa.onrender.com', 'https://cse-aa-server.onrender.com', 'http://cse-aa.vercel.app', 'https://cse-aa-git-main-nafims-projects.vercel.app/', 'https://cse-aa-nafims-projects.vercel.app/'],
    credentials: true,
    // origin: ['http://localhost:3000'],
}));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wlgklm6.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


//middleware for jwt
const logger = async (req, res, next) => {
    console.log("called:", req.hostname, req.originalUrl);
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of token in middleware', token);
    if (!token) {
        return res.status(401).send({ message: 'Not Authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //error
        if (err) {
            console.log(err);
            return res.status(401).send({ message: 'Not Authorized' })
        }
        //if token is valid then token will be decoded
        console.log('value in the token:', decoded);
        req.user = decoded;
        next();
    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        //auth related api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "none"
                })
                .send({ success: true })
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true });
        })

        //user section
        //------------
        const user = client.db('cseaa').collection('user');
        //for creating user
        app.post('/user', verifyToken, async (req, res) => {
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
        //for updating
        app.get('/user/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await user.findOne(query);
            res.send(result);
        })

        app.put('/user/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedUser = req.body;
            const update = {
                $set: {
                    name: updatedUser.name,
                    batch: updatedUser.batch,
                    phone: updatedUser.phone,
                    gender: updatedUser.gender,
                    blood: updatedUser.blood,
                    city: updatedUser.city,
                    role: updatedUser.role
                }
            }
            const result = await user.updateOne(filter, update, options);
            res.send(result);
        })

        //News Section
        //------------
        const news = client.db('cseaa').collection('news');
        //for reading news
        app.get('/news', logger, verifyToken, async (req, res) => {
            // console.log('tok tok token:', req.cookies.token);
            console.log('from valid token:', req.user);
            const cursor = news.find().sort({ createdAt: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })
        //for creating news
        app.post('/news', verifyToken, async (req, res) => {
            const newNews = req.body;
            console.log(newNews);
            const result = await news.insertOne(newNews);
            res.send(result);
        })


        //for deleting
        app.delete('/news/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await news.deleteOne(query);
            res.send(result);
        })
        //for updating
        app.get('/news/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await news.findOne(query);
            res.send(result);
        })
        app.put('/news/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedNews = req.body;
            const update = {
                $set: {
                    title: updatedNews.title,
                    post: updatedNews.post
                }
            }
            const result = await news.updateOne(filter, update, options);
            res.send(result);
        })
        //for admin approval 
        app.patch('/news/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const newsApprove = req.body;
            console.log(newsApprove);
            const updateApprove = {
                $set: {
                    approval: newsApprove.approval
                }
            };
            const result = await news.updateOne(filter, updateApprove);
            res.send(result);
        })


        //comment
        const comments = client.db('cseaa').collection('comments');
        app.post('/comments', async (req, res) => {
            const newComments = req.body;
            console.log(newComments);
            const result = await comments.insertOne(newComments);
            res.send(result);
        })
        app.get('/comments', async (req, res) => {
            const cursor = comments.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        //Endpoint to delete a single comment by _id
        app.delete('/comments/:id', async (req, res) => {
            console.log('single comment');
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            console.log(query);
            const result = await comments.deleteOne(query);
            res.send(result);
        });

        // Endpoint to delete comments associated with a news ID
        app.delete('/comments/:newsId', async (req, res) => {
            console.log('many comment');
            const newsId = req.params.newsId;
            try {
                // Delete comments associated with the news ID
                const result = await comments.deleteMany({ newsId });
                console.log(result, newsId);
                res.json(result);
            } catch (error) {
                console.error('Error deleting comments:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        //article section
        //-----------
        const article = client.db('cseaa').collection('article');
        //for reading article
        app.get('/article', async (req, res) => {
            const cursor = article.find().sort({ createdAt: -1 });
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
        app.put('/article/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedArticle = req.body;
            const update = {
                $set: {
                    title: updatedArticle.title,
                    details: updatedArticle.details,
                    photoUrl: updatedArticle.photoUrl
                }
            }
            const result = await article.updateOne(filter, update, options);
            res.send(result);
        })

        //for creating article
        app.post('/article', verifyToken, async (req, res) => {
            const newArticle = req.body;
            console.log(newArticle);
            const result = await article.insertOne(newArticle);
            res.send(result);
        })
        //for deleting
        app.delete('/article/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await article.deleteOne(query);
            res.send(result);
        })
        //for admin approval 
        app.patch('/article/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const articleApprove = req.body;
            console.log(articleApprove);
            const updateApprove = {
                $set: {
                    approval: articleApprove.approval
                }
            };
            const result = await article.updateOne(filter, updateApprove);
            res.send(result);
        })

        //Job Section
        const jobOffers = client.db('cseaa').collection('job');

        app.get('/job', async (req, res) => {
            const cursor = jobOffers.find().sort({ createdAt: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/job/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobOffers.findOne(query);
            res.send(result);
        })
        app.put('/job/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedJob = req.body;
            const job = {
                $set: {
                    name: updatedJob.name,
                    title: updatedJob.title,
                    position: updatedJob.position,
                    location: updatedJob.location,
                    description: updatedJob.description
                }
            }
            const result = await jobOffers.updateOne(filter, job, options)
            res.send(result);
        })

        app.post('/job', verifyToken, async (req, res) => {
            const newJob = req.body;
            console.log(newJob);
            const result = await jobOffers.insertOne(newJob);
            res.send(result);
        })

        app.delete('/job/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobOffers.deleteOne(query);
            res.send(result);
        })
        //for admin approval 
        app.patch('/job/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const jobApprove = req.body;
            console.log(jobApprove);
            const updateApprove = {
                $set: {
                    approval: jobApprove.approval
                }
            };
            const result = await jobOffers.updateOne(filter, updateApprove);
            res.send(result);
        })

        //Event Reg
        const jobApply = client.db('cseaa').collection('jobApply');
        app.post('/apply', verifyToken, async (req, res) => {
            const newJobApply = req.body;
            console.log(newJobApply);
            const result = await jobApply.insertOne(newJobApply);
            res.send(result);
        })

        app.get('/apply', verifyToken, async (req, res) => {
            const cursor = jobApply.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // Endpoint to delete reg associated with a event ID
        app.delete('/apply/:newsId', async (req, res) => {
            console.log('many comment');
            const jobId = req.params.jobId;
            try {
                // Delete comments associated with the news ID
                const result = await jobApply.deleteMany({ jobId });
                console.log(result, jobId);
                res.json(result);
            } catch (error) {
                console.error('Error deleting comments:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        //story section
        //---------------
        const storyCollection = client.db('cseaa').collection('story');

        app.get('/story', async (req, res) => {
            const cursor = storyCollection.find().sort({ createdAt: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post('/story', verifyToken, async (req, res) => {
            const newStory = req.body;
            console.log(newStory);
            const result = await storyCollection.insertOne(newStory);
            res.send(result);

        })
        //   //for deleting

        app.delete('/story/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await storyCollection.deleteOne(query);
            res.send(result);
            console.log(id);
        })



        ///event section
        const eventCollection = client.db('cseaa').collection('event');

        // Create Data
        app.post('/event', verifyToken, async (req, res) => {

            const newEvent = req.body;
            console.log(newEvent);
            const result = await eventCollection.insertOne(newEvent);
            res.send(result);
        })

        // Read Data
        app.get('/event', async (req, res) => {
            const cursor = eventCollection.find().sort({ createdAt: -1 });
            const result = await cursor.toArray();
            res.send(result);
        })

        // Delete
        app.delete('/event/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await eventCollection.deleteOne(query);
            res.send(result);
        })

        // Update
        app.get('/event/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await eventCollection.findOne(query);
            res.send(result);
        })

        app.put('/event/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedEvent = req.body;
            const event = {
                $set: {
                    title: updatedEvent.title,
                    photoUrl: updatedEvent.photoUrl,
                    description: updatedEvent.description,
                    startDate: updatedEvent.startDate,
                    endDate: updatedEvent.endDate,
                }
            }

            const result = await eventCollection.updateOne(filter, event, options);
            res.send(result);

        })
        //for admin approval 
        app.patch('/event/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const eventApprove = req.body;
            console.log(eventApprove);
            const updateApprove = {
                $set: {
                    approval: eventApprove.approval
                }
            };
            const result = await eventCollection.updateOne(filter, updateApprove);
            res.send(result);
        })



        //Event Reg
        const EventReg = client.db('cseaa').collection('eventReg');
        app.post('/reg', verifyToken, async (req, res) => {
            const newEventReg = req.body;
            console.log(newEventReg);
            const result = await EventReg.insertOne(newEventReg);
            res.send(result);
        })

        app.get('/reg', verifyToken, async (req, res) => {
            const cursor = EventReg.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        // Endpoint to delete reg associated with a event ID
        app.delete('/reg/:newsId', async (req, res) => {
            console.log('many comment');
            const eventId = req.params.eventId;
            try {
                // Delete comments associated with the news ID
                const result = await EventReg.deleteMany({ eventId });
                console.log(result, eventId);
                res.json(result);
            } catch (error) {
                console.error('Error deleting comments:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });




        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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

