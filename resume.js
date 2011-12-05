var Resume = function() {
  this.listen = function(app) {
    app.get('/resume', function(req, res){
      var experiences = [
        { company: 'LinkedIn',
          dates: '9/2010 &mdash; present',
          title: 'Software Engineer/Web Developer',
          description: '<p>I am playing with cool things like Hadoop, Pig, and <a href="http://project-voldemort.com/" target="_blank">Voldemort</a> to build data-driven products. Currently, I am working on adding features to and improving Who’s Viewed My Profile. From September \'10 to June \'11, I was part of the web development team, working on improving the experience of job seekers and job posters on LinkedIn. I also made contributions to the Javascript team.</p>' },
        { company: 'ChoiceVendor',
          dates: '11/2009 &mdash; 9/2010',
          title: 'Software Engineer',
          description: '<p>My work on the ChoiceVendor website involved responsibilities ranging from the business logic to the presentation level of the application. I worked on developing the application logic, which was written in Python using the Django framework. On the front end, I created the Jinja2 templates and the CSS and Javascript that accompanied them.</p><p>ChoiceVendor was acquired by LinkedIn in September 2010.</p>' },
        { company: 'Oracle',
          dates: '9/2008 &mdash; 11/2009',
          title: 'Applications Engineer',
          description: '<p>I worked on prototypes for Oracle\'s E-Business Suite, an enterprise software solution, gaining experience in Adobe Flex and Adobe Air.</p>' }
      ],

      projects = [
        { name: 'Hero Connect',
          url: 'http://heroconnect.linkedinlabs.com',
          dates: '11/2011',
          description: '<p>LinkedIn hosted a public-facing Veteran\'s Day Hackday in November 2011. My team\'s submission was Hero Connect, a web application which recommends companies who have recently hired veterans and makes it easy to connect with veterans at those companies.</p>'
        },
        { name: 'Faces of LinkedIn',
          url: 'http://koo.no.de/faces',
               dates: '7/2011',
               description: '<p>A mashup of the Face.com API and LinkedIn\'s Javascript API. Take your LinkedIn connections and filter them by who\'s happy, who\'s angry, who wears glasses, and more. Winner of LinkedIn\'s July Hackday.</p>'
        },
        { name: 'LinkedIn Connection Timeline',
          url: 'http://timeline.linkedinlabs.com',
          dates: '4/2011 &mdash; 5/2011',
          description: '<p>The Connection Timeline is an interactive visualization of the LinkedIn connections you\'ve made throughout your career.</p>'
        },
        { name: 'Grid',
          url: 'http://www.gordonkoo.com/grid',
          dates: '12/2010',
          description: '<p>My first foray into real-time applications using NodeJS and Socket.IO. It\'s best described as a collaborative drawing experience and worst described as an unfinished thing that lets you draw on one browser and see it happen on a different browser.</p>'
        }
      ];


      res.render('resume', {
        locals: { experiences: experiences, projects: projects },
        layout: false
      });
    });
  };
};

module.exports = new Resume();
