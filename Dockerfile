FROM nginx

MAINTAINER Keiichiro Ono <kono@ucsd.edu>

RUN apt-get update && apt-get install -y git curl ruby ruby-dev make bzip2 g++
RUN curl -sL https://deb.nodesource.com/setup | bash -
RUN apt-get install -y nodejs

# For building app
RUN gem install sass compass
RUN npm install -g grunt-cli bower phantomjs ws gifsicle

RUN mkdir /data
WORKDIR /data
RUN mkdir /data/app
WORKDIR /data/app

RUN git clone https://github.com/idekerlab/cyjs-sample.git

WORKDIR /data/app/cyjs-sample
RUN git checkout feature/polymer && git pull

RUN npm install
RUN bower install --allow-root --config.interactive=false --force
RUN grunt --force build

COPY dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]