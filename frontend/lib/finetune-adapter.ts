import type { FineTuneConfig, FineTuneRequest } from "./finetune-types"

export function toFineTuneRequest(
  config: FineTuneConfig
): FineTuneRequest {
  return {
    base_model_id: config.base_model,
    checkpoint: config.checkpoint,
    resume: config.resume,
    resume_checkpoint: config.resume_checkpoint,
    model_size: config.model_size,
    dataset_ids: config.datasets,

    epochs: config.epochs,
    save_period: config.save_period,
    num_train_loops: config.num_train_loops,
    img_size: config.img_size,
    layer_freeze: config.layer_freeze,
    batch_size: config.batch_size,
    learning_rate: config.learning_rate,
    patience: config.patience,

    augmentation: config.augmentation,
    dataset_config: config.dataset_config,
    tuning: config.tuning,
    export: config.export,

    data_dest_dir: config.data_dest_dir,
  }
}
