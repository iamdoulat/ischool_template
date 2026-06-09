"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, Save, RefreshCw, UserCheck, Search, Loader2 } from "lucide-react";
import api from "@/lib/api";
import * as faceapi from "face-api.js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  face_descriptor: any;
  avatar: string | null;
}

export default function FaceRegistrationPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("Student");
  
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [descriptor, setDescriptor] = useState<Float32Array | null>(null);
  
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get(`/api/v1/face-recognition/users?role=${roleFilter}`);
      const data = response.data?.data?.data || response.data?.data || [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const filtered = users.filter((u) => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setIsModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face models:", error);
        toast.error("Failed to load AI models");
      }
    };
    
    loadModels();
  }, []);

  const startVideo = async () => {
    if (!isModelsLoaded) {
      toast.error("Models are still loading...");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsVideoPlaying(true);
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
      toast.error("Could not access webcam. Please check permissions.");
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsVideoPlaying(false);
      setDescriptor(null);
      setIsDetecting(false);
      
      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  };

  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsDetecting(true);

    const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    const interval = setInterval(async () => {
      if (!videoRef.current || !isVideoPlaying) {
        clearInterval(interval);
        return;
      }

      const detection = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      if (canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if (detection) {
          const resizedDetections = faceapi.resizeResults(detection, displaySize);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
          
          // Auto-capture descriptor if we found one
          setDescriptor(detection.descriptor);
        } else {
          setDescriptor(null);
        }
      }
    }, 100);
    
    // store interval id if we need to clean it up when unmounting
    return () => clearInterval(interval);
  };

  const handleSaveFace = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }
    
    if (!descriptor) {
      toast.error("No face detected. Please ensure your face is clearly visible.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/api/v1/face-recognition/register', {
        user_id: selectedUser.id,
        face_descriptor: Array.from(descriptor) // Convert Float32Array to regular array for JSON
      });
      
      toast.success(`Face successfully registered for ${selectedUser.name}`);
      
      // Update local state to reflect registration
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, face_descriptor: Array.from(descriptor) } : u));
      
      if (selectedUser.id === selectedUser.id) {
        setSelectedUser({ ...selectedUser, face_descriptor: Array.from(descriptor) });
      }
      
      // Stop video after success
      stopVideo();
    } catch (error) {
      console.error("Error saving face:", error);
      toast.error("Failed to register face. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      stopVideo();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Face Registration</h2>
        <p className="text-muted-foreground">
          Register facial biometrics for students and staff for the smart attendance terminal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: User Selection */}
        <Card className="md:col-span-1 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Select Person</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setSelectedUser(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Teacher">Teacher</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="mt-4 border rounded-md h-[400px] overflow-y-auto bg-muted/20 p-2 space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="flex justify-center items-center h-full text-muted-foreground text-sm">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar ? `http://localhost:8000/storage/${user.avatar}` : ''} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-sm truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{user.email || 'No email'}</div>
                    </div>
                    {user.face_descriptor && (
                      <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" title="Face Registered" />
                    )}
                  </div>
                ))
              )}
            </div>

          </CardContent>
        </Card>

        {/* Right Column: Camera & Registration */}
        <Card className="md:col-span-2 shadow-sm border-0 ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Face Scanner</CardTitle>
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isModelsLoaded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {isModelsLoaded ? (
                  <>AI Models Ready</>
                ) : (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Loading Models...</>
                )}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {!selectedUser ? (
              <div className="h-[400px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                <UserCheck className="h-12 w-12 mb-4 opacity-50" />
                <p>Please select a user from the list first to register their face.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedUser.avatar ? `http://localhost:8000/storage/${selectedUser.avatar}` : ''} />
                      <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{selectedUser.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedUser.role} • {selectedUser.face_descriptor ? 'Already Registered (Will Overwrite)' : 'Not Registered'}</p>
                    </div>
                  </div>
                  {selectedUser.face_descriptor && (
                    <div className="text-green-600 font-medium text-sm flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
                      <UserCheck className="h-4 w-4" /> Enrolled
                    </div>
                  )}
                </div>

                <div className="relative w-full max-w-md mx-auto aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border-4 border-muted">
                  {!isVideoPlaying ? (
                    <div className="text-center text-white/70 p-6 flex flex-col items-center">
                      <Camera className="h-12 w-12 mb-2 opacity-50" />
                      <p>Webcam is off</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-4"
                        onClick={startVideo}
                        disabled={!isModelsLoaded}
                      >
                        Start Camera
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video 
                        ref={videoRef}
                        autoPlay
                        muted
                        onPlay={handleVideoPlay}
                        className="w-full h-full object-cover"
                      />
                      <canvas 
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                         <Button variant="destructive" size="sm" onClick={stopVideo}>Stop Camera</Button>
                      </div>
                      
                      {/* Scanning Overlay Indicator */}
                      {isDetecting && (
                        <div className="absolute top-4 right-4">
                          <div className={`h-3 w-3 rounded-full ${descriptor ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={handleSaveFace}
                    disabled={!descriptor || isSaving || !isVideoPlaying}
                    className="w-full max-w-md bg-gradient-to-r from-[#FF9800] to-[#6366F1] text-white font-medium"
                    size="lg"
                  >
                    {isSaving ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Face Data...</>
                    ) : (
                      <><Save className="mr-2 h-5 w-5" /> Register Face for {selectedUser.name}</>
                    )}
                  </Button>
                </div>
                
                {isVideoPlaying && !descriptor && (
                  <p className="text-center text-sm text-amber-600 mt-2">
                    Looking for a face... Please position yourself clearly in front of the camera.
                  </p>
                )}
                {isVideoPlaying && descriptor && (
                  <p className="text-center text-sm text-green-600 mt-2 font-medium">
                    Face detected! Ready to register.
                  </p>
                )}
                
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
