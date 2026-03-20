import pickle, numpy as np
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

with open('crop-model.pkl', 'rb') as f:
    crop_model = pickle.load(f)

initial_type = [('float_input', FloatTensorType([None, 7]))]
onnx_model = convert_sklearn(crop_model, initial_types=initial_type)

with open('crop-model.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())
print('crop-model.onnx written')

with open('fertilizer-model.pkl', 'rb') as f:
    data = pickle.load(f)
    fertilizer_model = data['model']

initial_type = [('float_input', FloatTensorType([None, 8]))]
onnx_model = convert_sklearn(fertilizer_model, initial_types=initial_type)

with open('fertilizer-model.onnx', 'wb') as f:
    f.write(onnx_model.SerializeToString())
print('fertilizer-model.onnx written')