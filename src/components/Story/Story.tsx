'use client'

import React, { useState, useRef, useEffect } from 'react';

interface Props {
    toggle: boolean;
    setToggle: React.Dispatch<React.SetStateAction<boolean>>;
}

function Story({ toggle, setToggle }: Props) {
    const [videoURLs, setVideoURLs] = useState<string[]>([
        '/videos/video1.mp4', // Example video file in the public folder
        '/videos/video2.mp4', // Another example video file in the public folder
    ]);
    const [videoDurations, setVideoDurations] = useState<number[]>([]); // Store durations for each video
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const progressRefs = useRef<HTMLDivElement[]>([]); // Keep references for multiple progress bars
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Cleanup when component unmounts or videoURLs changes
        return () => {
            videoURLs.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [videoURLs]);

    useEffect(() => {
        if (!toggle) {
            // Stop video and reset when closing
            if (videoRef.current) {
                setCurrentVideoIndex(0);
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
            resetStates();
        } else if (toggle) {
            // Play video if not already playing
            if (videoRef.current && !isPlaying) {
                videoRef.current.play();
                setIsPlaying(true);
                videoRef.current.currentTime = 0; // Restart the video when toggle is set to true
            }
            resetStates();
        }
    }, [toggle]);

    const resetStates = () => {
        setIsPlaying(false);
        // Reset the progress bar before transitioning to the next video
        if (progressRefs.current[currentVideoIndex]) {
            progressRefs.current[currentVideoIndex].style.width = '0%';
            progressRefs.current[currentVideoIndex].style.transition = 'none'; // Remove transition for resetting
        }
    };

    const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
        const videoElement = e.target as HTMLVideoElement;
        const newDurations = [...videoDurations];
        newDurations[currentVideoIndex] = videoElement.duration; // Update the duration for the current video
        setVideoDurations(newDurations);
    };

    const handleVideoPlay = () => {
        setIsPlaying(true);
        if (progressRefs.current[currentVideoIndex] && videoDurations[currentVideoIndex] > 0) {
            // Apply transition after video starts playing and duration is available
            progressRefs.current[currentVideoIndex].style.transition = `width ${videoDurations[currentVideoIndex]}s linear`;
            progressRefs.current[currentVideoIndex].style.width = '100%';
        }
    };

    const handleVideoEnded = () => {
        if (currentVideoIndex < videoURLs.length - 1) {
            setCurrentVideoIndex(prev => prev + 1);
            // Reset progress bar before changing to the next video
            if (progressRefs.current[currentVideoIndex]) {
                progressRefs.current[currentVideoIndex].style.width = '0%';
                progressRefs.current[currentVideoIndex].style.transition = 'none'; // Reset transition
            }
        } else {
            // Do not change toggle state on video end (unless you want to close the player)
            setToggle(false);
        }
    };

    const updateProgress = () => {
        if (videoRef.current && progressRefs.current[currentVideoIndex]) {
            const currentTime = videoRef.current.currentTime;
            const progress = (currentTime / videoDurations[currentVideoIndex]) * 100;
            progressRefs.current[currentVideoIndex].style.width = `${progress}%`;
        }
    };
    useEffect(() => {

    }, [])

    useEffect(() => {
        // Start tracking video progress
        const video = videoRef.current;
        let progressInterval: NodeJS.Timeout | null = null;

        if (video) {
            progressInterval = setInterval(updateProgress, 100); // Update progress every 100ms

            video.addEventListener('play', () => {
                // Ensure progress bar starts after the video begins playing
                setIsPlaying(true);
            });

            video.addEventListener('pause', () => {
                clearInterval(progressInterval!);
            });

            video.addEventListener('ended', () => {
                clearInterval(progressInterval!);
            });
        }

        return () => {
            if (progressInterval) {
                clearInterval(progressInterval);
            }
        };
    }, [videoDurations, currentVideoIndex]);

    return (
        <>
            <div
                onClick={(e) => {
                    e.preventDefault();
                    setToggle(false);
                }}
                className={`absolute bg-[rgba(0,0,0,0.5)] inset-0 ${toggle ? 'flex' : 'hidden'} justify-center`}
            >
                <div className='relative w-[400px] h-screen bg-black flex justify-center items-center cursor-pointer'>
                    {videoURLs.length > 0 ? (
                        <>
                            {/* Video Progress Bars */}
                            <div dir='rtl' className='absolute top-0 inset-x-0 p-4'>
                                <div className='w-full h-1 rounded-xl bg-gray-700'>
                                    {
                                        videoURLs.map((_, index) => (
                                            <div
                                                key={index}
                                                ref={(el) => {
                                                    if (el) {
                                                        progressRefs.current[index] = el;
                                                    }
                                                }}
                                                className="h-1 rounded-xl bg-white w-0"
                                            />
                                        ))
                                    }
                                </div>
                            </div>

                            {/* Video Carousel */}
                            <div className='absolute inset-0 w-full h-full' onClick={(e) => e.stopPropagation()}>
                                <video
                                    ref={videoRef}
                                    className='w-full h-full object-contain'
                                    key={videoURLs[currentVideoIndex]}
                                    onError={() => setError('Error loading video - try a different format')}
                                    autoPlay
                                    onLoadedMetadata={handleVideoMetadata}
                                    onPlay={handleVideoPlay}
                                    onEnded={handleVideoEnded}
                                >
                                    <source
                                        src={videoURLs[currentVideoIndex]}
                                        type="video/mp4"  // Assuming all videos are mp4
                                    />
                                    Your browser does not support video playback
                                </video>
                            </div>

                            {/* Navigation Controls */}
                            <div className='absolute top-1/2 left-0 p-4'>
                                <button
                                    className='bg-white text-black px-2 py-1 rounded'
                                    onClick={() => setCurrentVideoIndex(prev => Math.max(prev - 1, 0))}
                                >
                                    Previous
                                </button>
                            </div>
                            <div className='absolute top-1/2 right-0 p-4'>
                                <button
                                    className='bg-white text-black px-2 py-1 rounded'
                                    onClick={() => setCurrentVideoIndex(prev => Math.min(prev + 1, videoURLs.length - 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </>
                    ) : (
                        <span className='text-white'>No videos available</span>
                    )}

                    <div dir='rtl' className='absolute bottom-0 inset-x-0 p-4'>
                        <div className='w-full h-8 rounded-full border text-white px-4 flex items-center border-white'>
                            <input
                                type="text"
                                placeholder='نظر'
                                className='w-full bg-transparent outline-none'
                            />
                        </div>
                    </div>

                    {
                        error && (
                            <div className='absolute bottom-4 text-red-500 text-sm bg-white px-4 py-2 rounded'>
                                {error}
                            </div>
                        )
                    }
                </div>
            </div>
        </>
    );
}

export default Story;
