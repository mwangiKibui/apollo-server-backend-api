const {gql,ApolloServer} = require("apollo-server");
const faunadb = require("faunadb"), q = faunadb.query;

const faunaClient = new faunadb.Client({
    secret:"fnAEYeTDTKAAQwPeC7a9v_S0lzJlN4F5aVj_XMlY",
    domain: 'db.us.fauna.com',
    scheme: 'https',
    //secret:"fnAEYeLJMyAAQ-HsgpDB4FLrXq7GV1BW06yH2dmY"
})

// define shape of queries and mutations to be executed.

const typeDefs = gql`
    # defines the structure or the queryable fields for a book
    type Article{
        ref: String
        title: String
        summary: String
        content: String
    }

    # queries
    type Query {
        articles:[Article]
        article(id:ID):Article
    }

    # mutations 
    type Mutation {
        createArticle(title:String,summary:String,content:String):Article        
        deleteArticle(id:ID):Article
    }   
`;

// getting articles

const  getArticles = async() => {
    try{
        // Get the articles added.
        let {data} = await faunaClient.query(
            q.Map(
                q.Paginate(q.Documents(q.Collection("articles"))),
                q.Lambda(x => [ q.Select('id', x), q.Get(x) ])
            )
        );
        
        // Map through the articles, redefining the structure
        let articles = data.map((article) =>{
            return {
                "ref":article[0],
                ...article[1]['data']
            }
        });
        
        // return the articles.
        return articles;
    }catch(error){
        // return an error message
        return new Error(error).message;
    }
}

// creating an article

const createArticle = async (title,summary,content) => {
    try{
        const {data} = await faunaClient.query(
            q.Create(q.Collection("articles"),{data:{title,summary,content}})
        );
        return data;
    }catch(error){
        return new Error(error).message;
    }
}

// // updating a todo 

// const updateTodo = async (id) => {
//     try{
//         const {data} = await faunaClient.query(
//             q.Update(q.Ref(q.Collection("todos"),id),{data:{checked:true}})
//         );
//         return data;
//     }catch(error){
//         return new Error(error).message;
//     }
// }

// getting an article

const getArticle  = async (id) => {
    try{
        const {data} = await faunaClient.query(
            q.Get(q.Ref(q.Collection("articles"),id))
        );
        return data;
    }catch(error){
        return new Error(error).message;
    }
}

// define the resolvers

const resolvers = {
    Query:{
        articles: () => getArticles(),
        article: (_,{id}) => getArticle(id)
    },
    Mutation:{
        createArticle: (_,{title,summary,content}) => createArticle(title,summary,content),
        //updateTodo: (_,{id}) => updateTodo(id),
        //deleteArticle: (_,{id}) => deleteArticle(id),
    }
}

// Instanciate apollo server
const server = new ApolloServer({typeDefs,resolvers});

// Launch web server using listen
server.listen().then( ({url}) => {
    console.log(`server started on ${url}`);
});