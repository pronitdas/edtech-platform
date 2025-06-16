import os
import json
import os
import json

def extract_qwen_format_from_lmstudio(folder_path, output_path):
    all_examples = []

    for filename in os.listdir(folder_path):
        if filename.endswith(".conversation.json"):
            file_path = os.path.join(folder_path, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    messages = data.get("messages", [])
                except Exception as e:
                    print(f"❌ Failed to load {filename}: {e}")
                    continue

                flat_msgs = []

                for msg in messages:
                    version = msg.get("versions", [])[0]
                    role = version.get("role")
                    tool_call_blocks = []
                    if "tool_calls" in version:
                        for tool in version["tool_calls"]:
                            func = tool.get("function", tool)  # handles both nested or flat
                            tool_json = {
                                "name": func.get("name"),
                                "arguments": func.get("arguments")
                            }
                            tool_call_blocks.append(
                                f"<tool_call>\n{json.dumps(tool_json, ensure_ascii=False)}\n</tool_call>"
                            )

                    if tool_call_blocks:
                        assistant_msg += "\n" + "\n".join(tool_call_blocks)
                    if role == "user":
                        # User content: simple text extraction
                        text_parts = version.get("content", [])
                        text = "\n".join(p["text"] for p in text_parts if p["type"] == "text").strip()
                        flat_msgs.append({"role": "user", "content": text})

                    elif role == "assistant":
                        # Assistant content: from steps
                        steps = version.get("steps", [])
                        texts = []
                        for step in steps:
                            if step.get("type") == "contentBlock":
                                for p in step.get("content", []):
                                    if p["type"] == "text":
                                        texts.append(p["text"])
                        text = "\n".join(texts).strip()
                        flat_msgs.append({"role": "assistant", "content": text})

                # Extract user-assistant pairs
                for i in range(len(flat_msgs) - 1):
                    if flat_msgs[i]["role"] == "user" and flat_msgs[i + 1]["role"] == "assistant":
                        user_msg = flat_msgs[i]["content"]
                        assistant_msg = flat_msgs[i + 1]["content"]
                        if user_msg and assistant_msg:
                            all_examples.append({
                                "prompt": f"<|im_start|>user\n{user_msg}<|im_end|>\n<|im_start|>assistant\n",
                                "completion": f"{assistant_msg}<|im_end|>"
                            })

    with open(output_path, "w", encoding="utf-8") as out_file:
        json.dump(all_examples, out_file, indent=2)

    print(f"✅ Extracted {len(all_examples)} prompt-completion pairs into {output_path}")

# 🔁 Use it
extract_qwen_format_from_lmstudio("/mnt/c/Users/proni/.lmstudio/conversations", "qwen_)lm_lora_dataset.json")

# 🔁 Use it:
# consolidate_lmstudio_chats("/mnt/c/Users/proni/.lmstudio/conversations", "qwen_lora_dataset.json")
