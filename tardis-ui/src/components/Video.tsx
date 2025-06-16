import React from 'react'
import ReactPlayer from 'react-player/youtube'

const YouTubePlaceholder = ({ videoId }) => {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%', // Adjust to fit container height
    width: '100%', // Adjust to fit container width
    border: '3px solid #ccc', // Stylish border
    borderRadius: '8px', // Rounded corners
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow
    overflow: 'hidden', // Ensure video fits inside
    backgroundColor: '#000', // Placeholder background
  }

  const iframeStyle = {
    width: '100%',
    height: '100%',
    border: 'none',
  }

  return (
    <div style={containerStyle}>
      <video
        src={videoId}
        loop
        controls
        className='h-full w-full object-cover'
      />
    </div>
  )
}

export default YouTubePlaceholder
