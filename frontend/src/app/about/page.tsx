export default function About() {
  const team = [
    {
      name: "Sarah Johnson",
      role: "Morning Show Host",
      bio: "Sarah brings energy and positivity to your mornings with her infectious personality and great music taste.",
      image: "👩‍🎤"
    },
    {
      name: "Mike Rodriguez",
      role: "Afternoon Drive Host",
      bio: "Mike keeps you company during your commute with the perfect mix of music and engaging conversation.",
      image: "👨‍🎤"
    },
    {
      name: "Emma Chen",
      role: "Music Director",
      bio: "Emma curates our playlist and ensures we're always playing the freshest hits and timeless classics.",
      image: "👩‍💼"
    },
    {
      name: "David Thompson",
      role: "Technical Director",
      bio: "David keeps our signal strong and our sound crystal clear, ensuring the best listening experience.",
      image: "👨‍💻"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">About Iconic FM</h1>
          <p className="text-xl text-red-100 max-w-3xl">
            Broadcasting excellence since 1995, bringing you the best in music, 
            entertainment, and community connection.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Iconic FM began as a dream in 1995 when a group of music enthusiasts 
                  decided to create a radio station that truly connected with its community. 
                  What started as a small local station has grown into a beloved voice 
                  that reaches thousands of listeners daily.
                </p>
                <p>
                  Our mission has always been simple: to provide exceptional entertainment, 
                  showcase amazing music, and create a platform where voices from our 
                  community can be heard. We believe radio is more than just music – 
                  it's about connection, discovery, and shared experiences.
                </p>
                <p>
                  Today, we continue to evolve with the times while staying true to our 
                  core values of authenticity, quality, and community engagement. 
                  From our state-of-the-art studios to our online streaming platform, 
                  we're committed to delivering the best possible experience to our listeners.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg h-96 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">📻</div>
                <p className="text-xl font-semibold">30+ Years of Excellence</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Quality First</h3>
              <p className="text-gray-600">
                We're committed to delivering high-quality content and crystal-clear audio 
                that enhances your listening experience.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Community Focus</h3>
              <p className="text-gray-600">
                Our community is at the heart of everything we do. We celebrate local 
                talent and give voice to important community issues.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Innovation</h3>
              <p className="text-gray-600">
                We embrace new technologies and platforms to reach our audience 
                wherever they are, whenever they want to listen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">{member.image}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{member.name}</h3>
                <p className="text-red-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">30+</div>
              <p className="text-gray-300">Years Broadcasting</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">50K+</div>
              <p className="text-gray-300">Daily Listeners</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">24/7</div>
              <p className="text-gray-300">Live Streaming</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-500 mb-2">100+</div>
              <p className="text-gray-300">Shows Per Month</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}