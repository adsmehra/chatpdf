import {Pinecone, PineconeRecord} from '@pinecone-database/pinecone'
import { downloadFromS3 } from './s3-server'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {Document,RecursiveCharacterTextSplitter} from '@pinecone-database/doc-splitter'
import { getEmbeddings } from './embeddings';
import md5 from 'md5'
import { metadata } from '@/app/layout';
import { convertToAscii } from './utils';
import { Vector } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch/data';

let pinecone: Pinecone | null=null

export const getPineconeClient=async () => {
    if(!pinecone) {
        pinecone=new Pinecone({
            apiKey:process.env.PINECONE_API_KEY!,
        })
    }
    return pinecone
}

type PDFPage={
    pageContent:string;
    metadata:{
        loc: {pagenumber:number}
    }
}

export async function loadS3IntoPinecone(fileKey:string) {
    console.log('downloading s3 into file system')
    const file_name=await downloadFromS3(fileKey)
    if(!file_name){
        throw new Error("could not download from s3")
    }
    const loader=new PDFLoader(file_name)
    const pages=await loader.load() as PDFPage[]

    const documents=await Promise.all(pages.map(prepareDocument))

    const vectors=await Promise.all(documents.flat().map(embedDocument))

    const client =await getPineconeClient()
    const pineconeIndex=client.Index('chatpdf')
    
    console.log('inserting vectors to pinecone')
    const namespace=pineconeIndex.namespace(convertToAscii(fileKey))
    await namespace.upsert(vectors)
    return documents[0]


}

async function embedDocument(doc:Document){
    try{
        const embeddings=await getEmbeddings(doc.pageContent)
        const hash=md5(doc.pageContent)

        return {
            id: hash,
            values: Array.isArray(embeddings) ? embeddings : [embeddings],
            metadata:{
                text: doc.metadata.text,
                pageNumber:doc.metadata.pageNumber
            }
        } as PineconeRecord
    } catch (error) {
        console.log('error embedding document',error)
        throw error
    }
}


export const truncateStringByBytes=(str: string, bytes:number)=> {
    const enc=new TextEncoder()
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0,bytes))
}

async function prepareDocument(page:PDFPage) {
    let {pageContent,metadata} = page
    pageContent=pageContent.replace(/\n/g,'')
    const splitter=new RecursiveCharacterTextSplitter()
    const docs=await splitter.splitDocuments([
        new Document({
            pageContent,
            metadata:{
                pageNumber:metadata.loc.pagenumber,
                text: truncateStringByBytes(pageContent,36000)
            }
        })
    ])
    return docs
    
}