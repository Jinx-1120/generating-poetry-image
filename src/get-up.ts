import "dotenv/config";
import { SENTENCE_API } from "./const";

import { BingImageCreator } from "./bing-image-creator";
import type { SentenceResponse, Response } from "./types";

/**
 * Get the sentence
 * @returns SentenceResponse
 * @throws {Error} The error
 **/
export async function getSentence(): Promise<SentenceResponse> {
  try {
    const res = await fetch(SENTENCE_API);
    const data: SentenceResponse = await res.json();
    return data;
  } catch (e) {
    throw new Error("Request Sentence failed: ", e);
  }
}

async function getImageBySentence(
  cookie: string,
  sentence: SentenceResponse
): Promise<Response> {
  const bingImageCreator = new BingImageCreator({
    cookie: cookie,
  });

  const images = await bingImageCreator.createImage(sentence.content);
  return {
    images,
    content: sentence.content,
    origin: sentence.origin,
    author: sentence.author,
    category: sentence.category,
  };
}

export { getImageBySentence };
