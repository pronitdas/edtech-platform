'use client'

import { useState, useEffect } from 'react'
// import ModelViewer from './ModelViewer'; // Import a viewer component for 3D files, like GLTF
// import { checkTaskStatus, create3DModelTask } from './utils';

interface ModelGeneratorProps {
  prompt: string
}

const ModelGenerator: React.FC<ModelGeneratorProps> = ({ prompt }) => {
  const [taskId, setTaskId] = useState<string | null>(null)
  // const [modelData, setModelData] = useState<any>(null);
  // const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('PENDING')

  useEffect(() => {
    handlePromptSubmit()
  }, [prompt])

  const handlePromptSubmit = async () => {
    // const newTaskId = await create3DModelTask(prompt);
    if (true) {
      setTaskId('01930744-53d6-7755-8c91-ac6744229b0a')
      setStatus('IN_PROGRESS')
    }
  }

  useEffect(() => {
    if (taskId && status === 'IN_PROGRESS') {
      const interval = setInterval(async () => {
        // const taskStatus = await checkTaskStatus(taskId);
        // setProgress(taskStatus.progress);
        // setStatus(taskStatus.status);
        // setStatus("SUCCEEDED");
        // setModelData({
        //     modelUrl: "/solars_system.glb",
        //     // previewUrl: taskStatus.result.preview_url,
        //     // previewLogoUrl: taskStatus.result.preview_logo_url,
        //     // videoUrl: taskStatus.result.video_url,
        //     // textureUrls: taskStatus.result.texture_urls,
        // })
        // if (taskStatus.status === "SUCCEEDED") {
        //     setModelData(taskStatus.result);
        //     clearInterval(interval);
        // } else if (taskStatus.status === "FAILED") {
        //     clearInterval(interval);
        //     alert("3D Model generation failed. Please try again.");
        // }
      }, 2000) // Poll every 2 seconds

      return () => clearInterval(interval) // Clear interval on component unmount
    }
    // Return undefined for the else case
    return undefined
  }, [taskId, status])

  return (
    <div className='rounded-lg p-6 shadow-lg'>
      <h2 className='mb-4 text-2xl font-bold'>3D Model Generator</h2>
    </div>
  )
}

export default ModelGenerator
{
  /* <div className="mt-4">
{status === "IN_PROGRESS" && (
    <p>Generating model... Progress: {progress}%</p>
)}
{status === "SUCCEEDED" && modelData && (
   <ModelViewer 
   data={{
       modelUrl: modelData.modelUrl,                   // Main 3D model URL (e.g., GLB format)
       previewUrl: modelData.previewUrl || modelData.previewLogoUrl, // Choose preview or logo as the thumbnail
       previewLogoUrl: modelData.previewLogoUrl,       // Optional logo preview URL
       videoUrl: modelData.videoUrl,                   // Optional video URL for model
       textureUrls: modelData.textureUrls || []        // Array of texture URLs
   }}
/>
)}
</div> */
}
