import { cn } from '@/lib/utils'
import { Message } from 'ai/react'
import { Loader2 } from 'lucide-react';
import React from 'react'

type Props = {
    isLoading:boolean;
    messages:Message[]
}

const cleanLatex = (text:any) => {
    return text.replace(/\\text\{([^}]*)\}/g, '$1'); // Remove \text{} and keep inner text
};

const formatContent = (content:any) => {
    return content.split('\n').map((line: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<React.AwaitedReactNode> | null | undefined, index: React.Key | null | undefined) => {
        if (typeof line !== 'string') {
            // Check if line is null or undefined, or an empty string
            return null
        }

        if (line.includes('\\[') && line.includes('\\]')) {
            // Detect and clean LaTeX expressions
            console.log("found")
            const latexContent = line.match(/\\\[(.*?)\\\]/)?.[1] ?? '';
            const cleanedLatex = cleanLatex(latexContent);
            return <p key={index} className="mb-2 leading-relaxed">{cleanedLatex}</p>;
        } else {
            // Regular paragraph text
            return <p key={index} className="mb-2 ">{line}</p>;
        }
    });
};

const MessageList = ({messages,isLoading}: Props) => {
  if (isLoading){
    return (
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
            <Loader2 className='w-6 h-6 animate-spin' />
        </div>
    )
  }
  if (!messages) return <></>
  return (
    <div className='flex flex-col gap-2 px-4 py-2'>
        {messages.map(message=>{
            return (
                <div key={message.id} className={cn('flex',{
                    'justify-end pl-10':message.role==='user',
                    'justify-start pr-10':message.role==='system',
                })}>
                    <div className={
                        cn('rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10',{
                            'bg-blue-600 text-white':message.role==='user',
                        })
                    }>
                        {formatContent(message.content)}
                    </div>
                </div>
            )
        })}
    </div>
  )
}

export default MessageList