package inference

import (
	"fmt"
	
	ort "github.com/yalue/onnxruntime_go"
)

type Models struct {
	cropSession       *ort.AdvancedSession
	fertilizerSession *ort.AdvancedSession
	cropInput         *ort.Tensor[float32]
	cropOutputLabel   *ort.Tensor[int64]
	cropOutputProba   *ort.Tensor[float32]
	fertInput         *ort.Tensor[float32]
	fertOutputLabel   *ort.Tensor[int64]
	fertOutputProba   *ort.Tensor[float32]
	cropLabels        []string
	fertilizerLabels  []string
}

var defaultCropLabels = []string{
	"apple", "banana", "blackgram", "chickpea", "coconut", "coffee",
	"cotton", "grapes", "jute", "kidneybeans", "lentil", "maize",
	"mango", "mothbeans", "mungbean", "muskmelon", "orange", "papaya",
	"pigeonpeas", "pomegranate", "rice", "watermelon", "wheat",
}

var defaultFertilizerLabels = []string{
	"10-26-26", "14-35-14", "17-17-17", "20-20", "28-28",
	"DAP", "Urea",
}

func LoadModels(cropPath, fertilizerPath string) (*Models, error) {
	ort.SetSharedLibraryPath(getOrtLibPath())

	if err := ort.InitializeEnvironment(); err != nil {
		return nil, err
	}

	m := &Models{
		cropLabels:       defaultCropLabels,
		fertilizerLabels: defaultFertilizerLabels,
	}

	// Create crop session
	cropSession, cropInput, cropOutputLabel, cropOutputProba, err := createCropSession(cropPath)
	if err != nil {
		return nil, err
	}
	m.cropSession = cropSession
	m.cropInput = cropInput
	m.cropOutputLabel = cropOutputLabel
	m.cropOutputProba = cropOutputProba

	// Create fertilizer session
	fertSession, fertInput, fertOutputLabel, fertOutputProba, err := createFertilizerSession(fertilizerPath)
	if err != nil {
		return nil, err
	}
	m.fertilizerSession = fertSession
	m.fertInput = fertInput
	m.fertOutputLabel = fertOutputLabel
	m.fertOutputProba = fertOutputProba

	return m, nil
}

func (m *Models) PredictCrop(features []float32) (string, float64, error) {
	// Copy features to input tensor
	inputData := m.cropInput.GetData()
	copy(inputData, features)

	// Run inference
	err := m.cropSession.Run()
	if err != nil {
		return "", 0, err
	}

	// Get outputs
	idx := int(m.cropOutputLabel.GetData()[0])
	probas := m.cropOutputProba.GetData()
	
	var maxProba float64
	if idx >= 0 && idx < len(probas) {
		maxProba = float64(probas[idx])
	}

	label := "unknown"
	if idx >= 0 && idx < len(m.cropLabels) {
		label = m.cropLabels[idx]
	}

	return label, maxProba * 100, nil
}

func (m *Models) PredictFertilizer(features []float32) (string, error) {
	// Copy features to input tensor
	inputData := m.fertInput.GetData()
	copy(inputData, features)

	// Run inference
	err := m.fertilizerSession.Run()
	if err != nil {
		return "", fmt.Errorf("fertilizer session run failed: %w", err)
	}

	// Get output
	idx := int(m.fertOutputLabel.GetData()[0])
	
	label := "unknown"
	if idx >= 0 && idx < len(m.fertilizerLabels) {
		label = m.fertilizerLabels[idx]
	}

	return label, nil
}

func createCropSession(modelPath string) (*ort.AdvancedSession, *ort.Tensor[float32], *ort.Tensor[int64], *ort.Tensor[float32], error) {
	inputShape := ort.NewShape(1, 7)
	inputTensor, err := ort.NewEmptyTensor[float32](inputShape)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	outputLabelTensor, err := ort.NewEmptyTensor[int64](ort.NewShape(1))
	if err != nil {
		return nil, nil, nil, nil, err
	}

	outputProbaTensor, err := ort.NewEmptyTensor[float32](ort.NewShape(1, 23))
	if err != nil {
		return nil, nil, nil, nil, err
	}

	options, err := ort.NewSessionOptions()
	if err != nil {
		return nil, nil, nil, nil, err
	}

	session, err := ort.NewAdvancedSession(
		modelPath,
		[]string{"float_input"},
		[]string{"output_label", "output_probability"},
		[]ort.ArbitraryTensor{inputTensor},
		[]ort.ArbitraryTensor{outputLabelTensor, outputProbaTensor},
		options,
	)

	return session, inputTensor, outputLabelTensor, outputProbaTensor, err
}

func createFertilizerSession(modelPath string) (*ort.AdvancedSession, *ort.Tensor[float32], *ort.Tensor[int64], *ort.Tensor[float32], error) {
	inputShape := ort.NewShape(1, 8)
	inputTensor, err := ort.NewEmptyTensor[float32](inputShape)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	outputLabelTensor, err := ort.NewEmptyTensor[int64](ort.NewShape(1))
	if err != nil {
		return nil, nil, nil, nil, err
	}

	// Fertilizer model outputs probabilities (shape [1, 7] based on actual data)
	outputProbaTensor, err := ort.NewEmptyTensor[float32](ort.NewShape(1, 7))
	if err != nil {
		return nil, nil, nil, nil, err
	}

	options, err := ort.NewSessionOptions()
	if err != nil {
		return nil, nil, nil, nil, err
	}

	session, err := ort.NewAdvancedSession(
		modelPath,
		[]string{"float_input"},
		[]string{"output_label", "output_probability"},
		[]ort.ArbitraryTensor{inputTensor},
		[]ort.ArbitraryTensor{outputLabelTensor, outputProbaTensor},
		options,
	)

	return session, inputTensor, outputLabelTensor, outputProbaTensor, err
}

func getOrtLibPath() string {
	return "/usr/local/lib/libonnxruntime.so"
}
