from pathlib import Path
import torch
import threading

class SAM2Engine:
    _instance = None
    _lock = threading.Lock()

    def __init__(self, model_cfg: str, checkpoint_path: str):
        self.model_cfg = model_cfg
        self.checkpoint_path = checkpoint_path
        self.device = self._get_device()
        self.predictor = None
        self.loaded = False

    def _get_device(self):
        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")
        if device.type == "cuda":
            torch.autocast("cuda", dtype=torch.bfloat16).__enter__()
            if torch.cuda.get_device_properties(0).major >= 8:
                torch.backends.cuda.matmul.allow_tf32 = True
                torch.backends.cudnn.allow_tf32 = True
        return device

    def load(self):
        if self.loaded:
            return
        
        with SAM2Engine._lock:
            if not self.loaded:
                from sam2.build_sam import build_sam2_video_predictor
                self.predictor = build_sam2_video_predictor(self.model_cfg, self.checkpoint_path, device=torch.device(self.device))
                self.loaded = True

    def load_video(self, folder_path: str):
        self.load()
        return self.predictor.init_state(video_path=folder_path)

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = SAM2Engine(
                        model_cfg="configs/sam2.1/sam2.1_hiera_l.yaml",
                        checkpoint_path="checkpoints/sam2.1_hiera_large.pt",
                    )
        return cls._instance

# usage
# engine = SAM2Engine.get_instance()
# engine.load()  
# state = engine.load_video(folder_path)