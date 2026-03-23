package inference

import (
	ort "github.com/yalue/onnxruntime_go"
)

type Models struct {
	cropSession       *ort.AdvancedSession
	fertilizerSession *ort.AdvancedSession
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
	"DAP", "Potassium sulfate", "Superphosphate", "Urea", "Ammonium sulfate",
}

func LoadModels(cropPath, fertilizerPath string) (*Models, error) {
	ort.SetSharedLibraryPath(getOrtLibPath())

	if err := ort.InitializeEnvironment(); err != nil {
		return nil, err
	}

	cropSession, err := createSession(cropPath, 7)
	if err != nil {
		return nil, err
	}

	fertSession, err := createSession(fertilizerPath, 8)
	if err != nil {
		return nil, err
	}

	return &Models{
		cropSession:       cropSession,
		fertilizerSession: fertSession,
		cropLabels:        defaultCropLabels,
		fertilizerLabels:  defaultFertilizerLabels,
	}, nil
}

func (m *Models) PredictCrop(features []float32) (string, float64, error) {
	input, err := ort.NewTensor(ort.NewShape(1, int64(len(features))), features)
	if err != nil {
		return "", 0, err
	}

	defer input.Destroy()

	outputLabel, err := ort.NewEmptyTensor[int64](ort.NewShape(1))
	if err != nil {
		return "", 0, err
	}
	defer outputLabel.Destroy()

	outputProba, err := ort.NewEmptyTensor[float32](ort.NewShape(1, int64(len(m.cropLabels))))
	if err != nil {
		return "", 0, err
	}
	defer outputProba.Destroy()

	err = m.cropSession.Run()
	if err != nil {
		return "", 0, err
	}

	idx := int(outputLabel.GetData()[0])
	probas := outputProba.GetData()
	maxProba := float64(probas[idx])

	label := "unknown"
	if idx >= 0 && idx < len(m.cropLabels) {
		label = m.cropLabels[idx]
	}

	return label, maxProba * 100, nil
}

func (m *Models) PredictFertilizer(features []float32) (string, error) {
	input, err := ort.NewTensor(ort.NewShape(1, int64(len(features))), features)
	if err != nil {
		return "", err
	}
	defer input.Destroy()

	outputLabel, err := ort.NewEmptyTensor[int64](ort.NewShape(1))
	if err != nil {
		return  "", err
	}
	defer outputLabel.Destroy()

	err = m.fertilizerSession.Run()
	if err != nil {
		return "", err
	}

	idx := int(outputLabel.GetData()[0])
	label := "unknown"
	if idx >= 0 && idx < len(m.fertilizerLabels) {
		label = m.fertilizerLabels[idx]
	}

	return label, nil
}

func createSession(
	modelPath string, inputSize int) (*ort.AdvancedSession, error) {
	inputShape := ort.NewShape(1, int64(inputSize))
	inputTensor, err := ort.NewEmptyTensor[float32](inputShape)
	if err != nil {
		return nil, err
	}

	outputTensor, err := ort.NewEmptyTensor[float32](inputShape)
	if err != nil {
		return nil, err
	}

	options, err := ort.NewSessionOptions()
	if err != nil {
		return nil, err
	}

	session, err := ort.NewAdvancedSession(
		modelPath,
		[]string{"float_input"},
		[]string{"label"},
		[]ort.ArbitraryTensor{inputTensor},
		[]ort.ArbitraryTensor{outputTensor},
		options,
	)

	return session, err
}

func getOrtLibPath() string {
	return "/usr/local/lib/libonnxruntime.so"
}
