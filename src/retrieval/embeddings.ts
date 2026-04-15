/**
 * On-device embedding using ONNX Runtime Mobile.
 * Model: paraphrase-multilingual-MiniLM-L12-v2 (384 dims)
 * Handles Hindi, English, and Hinglish in a shared vector space.
 *
 * For v0 stub: returns random embeddings until the ONNX model is integrated.
 */

const EMBEDDING_DIMS = 384;

/** Stub: will be replaced with actual ONNX Runtime Mobile inference */
let onnxSession: any = null;

export async function initEmbeddingModel(): Promise<void> {
  // TODO: Load ONNX model from assets/models/
  // const modelPath = Asset.fromModule(require('../../assets/models/multilingual-minilm.onnx'));
  // onnxSession = await InferenceSession.create(modelPath.localUri);
  console.log('[Embeddings] Stub mode — returning random vectors');
}

export async function embedText(text: string): Promise<Float32Array> {
  if (onnxSession) {
    // TODO: Real ONNX inference
    // 1. Tokenize text
    // 2. Run through model
    // 3. Mean-pool token embeddings
    // 4. L2-normalize
    throw new Error('ONNX inference not yet implemented');
  }

  // Stub: deterministic pseudo-random embedding based on text content
  // This lets us test the retrieval pipeline end-to-end
  return stubEmbed(text);
}

/**
 * Deterministic stub embedding — same text always produces same vector.
 * Uses a simple hash-based approach so retrieval tests are reproducible.
 */
function stubEmbed(text: string): Float32Array {
  const embedding = new Float32Array(EMBEDDING_DIMS);
  const normalized = text.toLowerCase().trim();

  // Seed from text hash
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  // Generate pseudo-random but deterministic values
  let seed = hash;
  for (let i = 0; i < EMBEDDING_DIMS; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    embedding[i] = (seed / 0x7fffffff) * 2 - 1;
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMS; i++) {
    norm += embedding[i] * embedding[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMS; i++) {
      embedding[i] /= norm;
    }
  }

  return embedding;
}

export function getEmbeddingDims(): number {
  return EMBEDDING_DIMS;
}
