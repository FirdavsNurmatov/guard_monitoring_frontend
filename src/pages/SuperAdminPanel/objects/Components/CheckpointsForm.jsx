import { Input, InputNumber, Button, Form } from "antd";

const CheckpointsForm = ({
  checkpoints,
  handleChange,
  handleDelete,
  cardNumberErrors,
}) => {
  if (!checkpoints.length) return null;

  return (
    <div className="mt-4 space-y-2">
      {checkpoints.map((cp, i) => (
        <div
          key={i}
          className="flex flex-wrap gap-3 items-center border p-2 rounded"
        >
          {/* Checkpoint name */}
          <Input
            placeholder="Checkpoint name"
            value={cp.name || `${i + 1}-punkt`}
            onChange={(e) => handleChange(i, "name", e.target.value)}
            style={{ width: "200px" }}
          />

          {/* Normal time */}
          <InputNumber
            min={1}
            value={cp.normalTime}
            onChange={(val) => handleChange(i, "normalTime", val)}
            addonAfter="min"
            style={{ width: "120px" }}
          />

          {/* Pass time */}
          <InputNumber
            min={1}
            value={cp.passTime}
            onChange={(val) => handleChange(i, "passTime", val)}
            addonAfter="min"
            style={{ width: "120px" }}
          />

          {/* Card number + validation */}
          <Form.Item
            validateStatus={cardNumberErrors?.[cp.cardNumber] ? "error" : ""}
            help={cardNumberErrors?.[cp.cardNumber]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="Card number"
              value={cp.cardNumber}
              onChange={(e) => handleChange(i, "cardNumber", e.target.value)}
              style={{ width: "150px" }}
            />
          </Form.Item>

          {/* X percent */}
          <InputNumber
            min={0}
            max={100}
            value={cp?.position?.xPercent ?? 0}
            onChange={(val) =>
              handleChange(i, "position", {
                ...cp.position,
                xPercent: val,
              })
            }
            addonAfter="X%"
            style={{ width: "120px" }}
          />

          {/* Y percent */}
          <InputNumber
            min={0}
            max={100}
            value={cp?.position?.yPercent ?? 0}
            onChange={(val) =>
              handleChange(i, "position", {
                ...cp.position,
                yPercent: val,
              })
            }
            addonAfter="Y%"
            style={{ width: "120px" }}
          />

          {/* Latitude */}
          <InputNumber
            placeholder="Lat"
            value={cp?.location?.lat ?? 0}
            onChange={(val) =>
              handleChange(i, "location", {
                ...cp.location,
                lat: val,
              })
            }
            addonAfter="Lat"
          />

          {/* Longitude */}
          <InputNumber
            placeholder="Lng"
            value={cp?.location?.lng ?? 0}
            onChange={(val) =>
              handleChange(i, "location", {
                ...cp.location,
                lng: val,
              })
            }
            addonAfter="Lng"
          />

          {/* Delete */}
          <Button danger onClick={() => handleDelete(i)}>
            🗑️
          </Button>
        </div>
      ))}
    </div>
  );
};

export default CheckpointsForm;
