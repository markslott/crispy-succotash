## Super Simple LangChain Powered Chatbot  

### How this thing works  

When you get it running, it looks like this:  

![Screenshot](./doc/2024-10-04_18-20-36.png "Screenshot")

The code is meant to be as portable as possible.  I used a standards based browser friendly generic web component  
It should just drop into whatever framework your developer wants to use  

This sample uses a service called Tavily to do some internet searches.  You will need to go to [tavily.com](https://tavily.com/#api) and get an API key to use it.  Since this is using langchain, you can add whatever retrievers and tools you want to the `serve.py` python script, so have at it.  Elastic has some python retrievers, which you can use to make a RAG tool

I also used LangSmith with this sample, which is very nice if you want to see what the LLM is actually doing.  You can go to [smith.langchain.com](https://smith.langchain.com/) to sign up and get a LangChain API key.  You don't have to use it, but it's pretty informative and I'd recommend looking at it  

To make this a little safer to put online if you want to, I have implemented a very basic API key.  You can just pass an arbitraty key of your liking as a query parameter.  You can also just directly pass it to the web component via an attribute.  The backend API `serve.py` will check for the API key in the HTTP header, so you can put this out on the internet and nobody is going to be able to hit the service without knowing your key.

### Configuration  

You will need to set up a `.env` file with some environment variables to get this thing going:

```bash
    OPENAI_API_KEY=<Your Open AI API key>
    TAVILY_API_KEY=<Your Tavily API key>
    LANGCHAIN_API_KEY=<Your Langchain API key>
    LANGCHAIN_TRACING_V2=true
    API_KEY=<Your super secret made up API key> 
```

If you are going to use the elastic rag tool, you'll need environment vars for that as well:  

```bash
    ES_USER=<Your elastic userid>  
    ES_PASSWORD=<Your elastic password>
    ES_URL=<The URL to the ES api>
```

You will want to modify the `elastic_rag_tool.py` module so that it suits your purposes.  This is just a sample  
that performs a dense vector search, but you can do whatever you want.  Just have to change a couple of functions.  

That's it... after that you're ready to run it  

### Running it locally

I would recommend doing this in a python virtual environment.  I used python 3.12  

```bash
pip install -r requirements.txt
python serve.py
```

This will start a server on port 8000.  To access your chatbot, just go to [http://localhost:8000/index.html](http://localhost:8000/index.html)  

This little toy doesn't display error messages.  If it's not working, you'll have to look in the browser javascript console or in stdout on your python environment.
