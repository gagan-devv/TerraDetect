import pickle, onnxruntime as rt, numpy as np, pandas as pd

sess = rt.InferenceSession('crop-model.onnx')
df = pd.read_csv('crop-data.csv').sample(50)
X = df[['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']].values.astype(np.float32)

with open('crop-model.pkl', 'rb') as f:
    sk_model = pickle.load(f)

sk_preds = sk_model.predict(X)
onnx_preds = sess.run(None, {'float_input': X})[0]

mismatches_count = int((sk_preds != onnx_preds).sum())
print(f"Mismatches: {mismatches_count}/50 ({'PASS' if mismatches_count == 0 else 'FAIL'})")
